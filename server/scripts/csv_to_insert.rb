#!/usr/bin/env ruby

require 'csv'
require 'English'
require 'fileutils'

# This script converts CSV files into SQL dump format.
#
# Usage:
#   ./csv_to_insert.sh <input_path> [output_directory]
#
# The script will:
# 1. If a directory is provided, convert all .csv files within it.
# 2. If a single .csv file is provided, convert just that file.
# 3. Save the .sql files to a sibling 'sql_files' directory, or a specified [output_directory].
# 4. Use the CSV filename (without extension) as the table name.
# 5. Use the first row of the CSV as column names.
# 6. Batch multiple rows into a single INSERT statement for efficiency.

# --- Configuration ---
INSERT_BATCH_SIZE = 100
# 進捗表示は1秒毎に更新

# --- Helper Methods ---
def format_file_size(bytes)
  units = ['B', 'KB', 'MB', 'GB', 'TB']
  unit_index = 0
  size = bytes.to_f

  while size >= 1024 && unit_index < units.length - 1
    size /= 1024.0
    unit_index += 1
  end

  "#{size.round(2)} #{units[unit_index]}"
end

def format_duration(seconds)
  hours = seconds / 3600
  minutes = (seconds % 3600) / 60
  secs = seconds % 60

  if hours > 0
    "#{hours}h #{minutes}m #{secs}s"
  elsif minutes > 0
    "#{minutes}m #{secs}s"
  else
    "#{secs}s"
  end
end

def clear_line
  print "\r#{' ' * 100}\r"
end

def print_progress(message)
  clear_line
  print message
  $stdout.flush
end

def print_final(message)
  clear_line
  puts message
end

# 安全な文字列エスケープ処理
def safe_escape_field(field)
  return 'NULL' if field.nil? || field.empty?

  # 文字列に変換
  str = field.to_s.dup

  # 不正な文字を除去（制御文字、NULL文字など）
  str.gsub!(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/, '')

  # 不正なUTF-8バイトシーケンスを除去
  str = str.encode('UTF-8', 'UTF-8', invalid: :replace, undef: :replace, replace: '')

  # MySQLで問題となる文字をエスケープ
  str.gsub!('\\', '\\\\')  # バックスラッシュを二重に
  str.gsub!("'", "''")     # シングルクォートを二重に
  str.gsub!('"', '""')     # ダブルクォートを二重に
  str.gsub!("\n", '\\n')   # 改行をエスケープ
  str.gsub!("\r", '\\r')   # キャリッジリターンをエスケープ
  str.gsub!("\t", '\\t')   # タブをエスケープ

  # 4バイト文字（絵文字など）を除去（MySQL utf8mb4でない場合）
  # str.gsub!(/[\u{10000}-\u{10FFFF}]/, '')

  "'#{str}'"
end

# --- Conversion Function ---
def convert_csv_to_sql(csv_file_path, output_dir)
  return unless csv_file_path == 'server/tmp/csv_files/projects.csv'

  output_filename = File.basename(csv_file_path).sub(/\.csv\z/, '.sql')
  output_file_path = File.join(output_dir, output_filename)
  table_name = File.basename(csv_file_path, '.csv')

  # ファイルサイズを取得
  file_size = File.size(csv_file_path)
  file_size_formatted = format_file_size(file_size)

  puts "Processing '#{File.basename(csv_file_path)}' (#{file_size_formatted}) -> '#{output_file_path}'"

  begin
    start_time = Time.now
    headers = nil
    row_count = 0
    values_clauses = []
    processed_bytes = 0
    last_progress_time = start_time
    error_count = 0

    File.open(output_file_path, 'w', encoding: 'UTF-8') do |sql_file|
      # --- SQL Dump Headers ---
      sql_file.puts "-- SQL Dump generated from #{File.basename(csv_file_path)}"
      sql_file.puts "-- Generated at #{Time.now}"
      sql_file.puts "--"
      sql_file.puts "SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;"
      sql_file.puts "SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;"
      sql_file.puts "SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';"
      sql_file.puts "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;\n"

      # ファイルを開いて位置を追跡
      File.open(csv_file_path, 'r', encoding: 'bom|utf-8') do |file|
        csv = CSV.new(file, headers: true)

        csv.each do |row|
          begin
            # 現在のファイル位置を取得
            current_pos = file.pos
            processed_bytes = current_pos

            # 最初の行でヘッダーを設定
            if headers.nil?
              headers = row.headers.map { |h| "`#{h.to_s.strip}`" }.join(', ')

              # ヘッダーのみの場合は早期リターン
              next if row.fields.all? { |field| field.nil? || field.empty? }

              sql_file.puts "LOCK TABLES `#{table_name}` WRITE;"
              sql_file.puts "/*!40000 ALTER TABLE `#{table_name}` DISABLE KEYS */;"
            end

            # データ行を処理
            values = row.fields.map { |field| safe_escape_field(field) }.join(', ')
            values_clauses << "(#{values})"
            row_count += 1

            # バッチサイズに達したら書き込み
            if values_clauses.size >= INSERT_BATCH_SIZE
              sql_file.puts "INSERT INTO `#{table_name}` (#{headers}) VALUES\n#{values_clauses.join(",\n")};"
              values_clauses.clear
            end

          rescue => e
            error_count += 1
            # エラーが発生した行をスキップして続行
            puts "\n  Warning: Skipped row #{row_count + 1} due to error: #{e.message}"
            next
          end

          # 進捗表示（1秒毎に更新）
          current_time = Time.now
          if (current_time - last_progress_time) >= 1.0
            elapsed_time = current_time - start_time
            progress_percent = (processed_bytes.to_f / file_size * 100).round(1)
            processed_size_formatted = format_file_size(processed_bytes)
            rows_per_second = (row_count / elapsed_time).round(0)

            # 推定残り時間を計算
            if progress_percent > 0 && progress_percent < 100
              estimated_total_time = elapsed_time / (progress_percent / 100.0)
              remaining_time = estimated_total_time - elapsed_time
              remaining_formatted = format_duration(remaining_time.to_i)

              # プログレスバー（20文字）
              filled_blocks = (progress_percent / 5.0).to_i
              progress_bar = "█" * filled_blocks + "░" * (20 - filled_blocks)

              error_info = error_count > 0 ? " | Errors: #{error_count}" : ""
              print_progress("  [#{progress_bar}] #{progress_percent}% (#{processed_size_formatted}/#{file_size_formatted}) | #{row_count} rows | #{rows_per_second} rows/sec | ETA: #{remaining_formatted}#{error_info}")
            else
              error_info = error_count > 0 ? " | Errors: #{error_count}" : ""
              print_progress("  Processing: #{row_count} rows | #{rows_per_second} rows/sec#{error_info}")
            end

            last_progress_time = current_time
          end
        end
      end

      # 残りのデータを書き込み
      if values_clauses.any?
        sql_file.puts "INSERT INTO `#{table_name}` (#{headers}) VALUES\n#{values_clauses.join(",\n")};"
      end

      # データがある場合のみフッターを書き込み
      if row_count > 0
        # --- SQL Dump Footers ---
        sql_file.puts "/*!40000 ALTER TABLE `#{table_name}` ENABLE KEYS */;"
        sql_file.puts "UNLOCK TABLES;"
        sql_file.puts
        sql_file.puts "SET SQL_MODE=@OLD_SQL_MODE;"
        sql_file.puts "SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;"
        sql_file.puts "SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;"
      end
    end

    # 完了メッセージ
    total_time = Time.now - start_time
    total_time_formatted = format_duration(total_time.to_i)
    average_rows_per_second = (row_count / total_time).round(0)

    error_summary = error_count > 0 ? " (#{error_count} errors skipped)" : ""
    print_final("  ✅ Completed: #{row_count} rows processed in #{total_time_formatted} (avg: #{average_rows_per_second} rows/sec)#{error_summary}")

  rescue CSV::MalformedCSVError => e
    print_final("  ❌ Error: Failed to parse '#{csv_file_path}'. It may be a malformed CSV.")
    puts "  Details: #{e.message}"
  rescue StandardError => e
    print_final("  ❌ An unexpected error occurred while processing '#{csv_file_path}': #{e.message}")
  end
end

# --- Main Execution Logic ---
if ARGV.length < 1 || ARGV.length > 2
  puts "Usage: #{$PROGRAM_NAME} <input_path> [output_directory]"
  puts "  <input_path>: Path to a single CSV file or a directory of CSV files."
  puts "  [output_directory]: Optional. Directory to save .sql files. Defaults to a sibling 'sql_files' directory."
  exit 1
end

input_path = ARGV[0]
output_dir_path = ARGV[1]

unless File.exist?(input_path)
  puts "Error: Input path '#{input_path}' not found."
  exit 1
end

# Determine the final output directory
final_output_dir = if output_dir_path
                     output_dir_path
                   else
                     # Default to a sibling 'sql_files' directory relative to the input path
                     base_dir = File.directory?(input_path) ? input_path : File.dirname(input_path)
                     File.expand_path('sql_files', File.dirname(base_dir))
                   end

# Create the output directory if it doesn't exist
FileUtils.mkdir_p(final_output_dir) unless File.directory?(final_output_dir)

if File.directory?(input_path)
  csv_files = Dir.glob(File.join(input_path, '*.csv')).sort
  if csv_files.empty?
    puts "No .csv files found in directory '#{input_path}'."
  else
    puts "Found #{csv_files.length} CSV files. Outputting to '#{final_output_dir}'."
    csv_files.each_with_index do |file, index|
      puts "\n[#{index + 1}/#{csv_files.length}] Processing file..."
      convert_csv_to_sql(file, final_output_dir)
    end
  end
elsif input_path.end_with?('.csv')
  convert_csv_to_sql(input_path, final_output_dir)
else
  puts "Error: Provided path is not a directory or a .csv file."
  exit 1
end

puts "\n🎉 All conversions complete!"
