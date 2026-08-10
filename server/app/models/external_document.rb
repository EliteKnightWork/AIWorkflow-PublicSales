# == Schema Information
#
# Table name: external_documents
# Database name: primary
#
#  id                                         :bigint           not null, primary key
#  attachable_type                            :string(255)
#  is_processed(テキスト抽出処理実行済フラグ) :boolean          default(FALSE), not null
#  text(ファイル内テキスト)                   :text(4294967295)
#  created_at                                 :datetime
#  updated_at                                 :datetime
#  attachable_id                              :bigint
#
# Indexes
#
#  index_external_documents_on_attachable_type_and_attachable_id  (attachable_type,attachable_id)
#
class ExternalDocument < ApplicationRecord
  include FileNameValidatable
  include Rails.application.routes.url_helpers

  belongs_to :attachable, polymorphic: true, touch: true

  after_commit :notify_project_embeddings, on: :update, if: :saved_change_to_text?
  has_one_attached :file

  def extract_and_update_text
    return unless self.file.attached?
    text = nil
    retries = 0
    max_retries = 5

    Rails.logger.info("ExternalDocument:ExtractText: Started processing document ID: #{self.id}")

    begin
      text = case file.blob.content_type
             when 'application/pdf'
               extract_text_from_pdf
             when 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
               extract_text_from_docx
             when 'application/msword', 'application/vnd.ms-word', 'application/x-msword'
               extract_text_from_doc
             else
               self.update!(is_processed: true)
               return
             end

      update_params = { is_processed: true }
      update_params[:text] = text if text.present?
      self.update!(update_params)
    rescue ActiveStorage::FileNotFoundError, IOError => e
      if retries < max_retries
        retries += 1
        Rails.logger.info("ExternalDocument:ExtractText: Retrying #{retries}/#{max_retries} for document ID: #{self.id}")
        sleep(2 * retries) # 待機時間を増やしながらリトライ
        retry
      else
        Rails.logger.error("ExternalDocument:ExtractText: Failed after #{max_retries} retries for document ID: #{self.id}: #{e.message}")
        Sentry.capture_exception(e)
        # 最大リトライ回数を超えた場合でも処理済みフラグを立てておく
        self.update!(is_processed: true)
      end
    end
  end

  private

  def extract_text_from_pdf
    tmp_file = tmp_file(self.file.download)
    begin
      reader = PDF::Reader.new(tmp_file.path)
      text = reader.pages.map(&:text).join
      if text.scan(/[\p{Hiragana}\p{Katakana}\p{Han}]/).length == 0
        text = Pdftotext.text(tmp_file.path)
      end
      text
    rescue PDF::Reader::EncryptedPDFError, PDF::Reader::MalformedPDFError, PDF::Reader::UnsupportedFeatureError => e
      Rails.logger.error("ExternalDocument:ExtractText: Failed to extract text from PDF for document ID: #{self.id}: #{e.message}")
      nil
    rescue => e
      Rails.logger.error("ExternalDocument:ExtractText: Unexpected error for PDF document ID: #{self.id}: #{e.message}")
      nil
    end
  end

  def extract_text_from_docx
    tmp_file = tmp_file(self.file.download)
    begin
      # まずZip+Nokogiri方式で抽出を試みる
      Zip::File.open(tmp_file.path) do |zip_file|
        xml = zip_file.read('word/document.xml')
        doc = Nokogiri::XML(xml)
        return doc.xpath('//w:t').map(&:text).join("\n")
      end
    rescue => e
      Rails.logger.warn("ExternalDocument:ExtractText: Zip+Nokogiri方式での抽出に失敗: #{e.message}")
      # 失敗した場合はDocx::Document方式で再試行
      begin
        doc = Docx::Document.open(tmp_file.path)
        return doc.paragraphs.map(&:text).join("\n")
      rescue Errno::EIO, Docx::Document::Error => e2
        Rails.logger.error("ExternalDocument:ExtractText: Docx::Document方式でも抽出に失敗: #{e2.message}")
        nil
      end
    end
  end

  def extract_text_from_doc
    require 'open3'
    tmp = tmp_file(self.file.download)
    begin
      stdout, _, status = Open3.capture3('catdoc', '-w', '-d', 'utf-8', tmp.path)
      return stdout if status.success? && stdout.present?

      mapping = '/usr/share/antiword/UTF-8.txt'
      args = ['antiword']
      args += ['-m', mapping] if File.exist?(mapping)
      args << tmp.path
      stdout, _, status = Open3.capture3(*args)
      return stdout if status.success? && stdout.present?

      nil
    rescue => e
      Rails.logger.error("ExternalDocument:ExtractText: .doc抽出に失敗: #{self.id}: #{e.message}")
      nil
    end
  end

  def tmp_file(binary)
    tmp_file = Tempfile.new
    tmp_file.binmode
    tmp_file.write(binary)
    tmp_file.rewind
    tmp_file
  end

  def notify_project_embeddings
    attachable.check_and_build_project_embeddings if attachable.respond_to?(:check_and_build_project_embeddings)
  end
end
