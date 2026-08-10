require 'csv'
require 'aws-sdk-s3'

namespace :db_export do
  desc 'projectsテーブルをTSVファイルにエクスポートしてS3にアップロード'
  task :projects => :environment do

    file_name = "projects_#{Time.zone.now.strftime('%Y%m%d%H%M%S')}.tsv"
    file_path = Rails.root.join('tmp', file_name)

    CSV.open(file_path, 'w', force_quotes: true, col_sep: "\t") do |tsv|
      tsv << %w[id title description]
      Project.find_each do |project|
        tsv << [project.id, project.title, project.description].map { |str| remove_tab(str) }
      end
    end

    upload_to_s3(file_path, file_name)
  end

  desc 'external_documentsテーブルをTSVファイルにエクスポートしてS3にアップロード'
  task :external_documents => :environment do
    file_name = "external_documents_#{Time.zone.now.strftime('%Y%m%d%H%M%S')}.tsv"
    file_path = Rails.root.join('tmp', file_name)

    CSV.open(file_path, 'w', force_quotes: true, col_sep: "\t") do |tsv|
      tsv << %w[project_id text]
    end

    batch_size = 1000
    total_count = ExternalDocument.where(attachable_type: 'Project').count
    total_batches = (total_count.to_f / batch_size).ceil

    ExternalDocument.where(attachable_type: 'Project').find_in_batches(batch_size: batch_size).with_index do |batch, index|
      CSV.open(file_path, 'a', force_quotes: true, col_sep: "\t") do |tsv|
        batch.pluck(:attachable_id, :text).each do |id, text|
          tsv << [id, remove_tab(text)]
        end
      end

      Rails.logger.info("Processed batch #{index + 1} of #{total_batches}")
    end

    upload_to_s3(file_path, file_name)
  ensure
    File.delete(file_path)
  end

  def upload_to_s3(file_path, file_name)
    s3 = Aws::S3::Resource.new
    bucket = s3.bucket(Settings.aws.s3.bucket.db_export)
    obj = bucket.object(file_name)
    obj.upload_file(file_path)

    Rails.logger.info("Uploaded: #{obj.public_url}")
  end

  def remove_tab(str)
    return str unless str.respond_to?(:tr)

    str.tr("\t", ' ')
  end
end
