require 'open-uri'
require 'open_uri_redirections'
require 'nokogiri'

namespace :kkj_api do
  desc '官公需ポータルAPIを叩いてprojectsテーブルに保存'
  # NOTE: 引数で開始日と終了日を指定(例: rake kkj_api:fetch[2023-09-01,2023-09-30])
  task :fetch, [:start_date, :end_date] => :environment do |_task, args|
    lg_codes = (1..47).to_a
    start_date, end_date = determine_dates(args)
    (start_date..end_date).each do |date|
      Rails.logger.info('===============================')
      Rails.logger.info("Date: #{date}")
      fetch_and_process(lg_codes, date)
    end
  end

  def determine_dates(args)
    if args[:start_date].nil? || args[:end_date].nil?
      # NOTE: 2日前から当日までのデータを取得
      [Time.zone.today - 2.days, Time.zone.today]
    else
      [Date.parse(args[:start_date]), Date.parse(args[:end_date])]
    end
  end

  def fetch_and_process(lg_codes, date)
    Rails.logger.info('-------------------------------'.indent(4))
    Rails.logger.info("LG_Code: #{lg_codes.join(',')}")

    target_date_range = "#{date.strftime('%Y-%m-%d')}/#{date.strftime('%Y-%m-%d')}"
    url = URI.parse("https://www.kkj.go.jp/api/?LG_Code=#{lg_codes.join(',')}&CFT_Issue_Date=#{target_date_range}&Count=1000")
    Rails.logger.info("URL: #{url}")
    xml = Nokogiri::XML(url.open(allow_redirections: :all))
    total_count = xml.xpath('//SearchHits').text.to_i
    Rails.logger.info("total_count: #{total_count}".indent(2))

    # NOTE: 取得件数が1000件を超える場合は、2分割にして再実行
    if total_count >= 1000 && lg_codes.size > 1
      mid = lg_codes.size / 2
      fetch_and_process(lg_codes[0...mid], date)
      fetch_and_process(lg_codes[mid..], date)
    else
      process_results(xml, total_count)
    end
  end

  def process_results(xml, total_count)
    # NOTE: 取得元サイトの識別子(https://github.com/Nehan-Inc/labid/pull/856)
    source = 'o_kkj-api'

    xml.xpath('//SearchResult').each.with_index(1) do |result, i|
      Rails.logger.info("#{i} / #{total_count}".indent(6))

      project = Project.find_or_initialize_by(key: result.xpath('Key').text, source: source)
      next if project.persisted?

      procedure_type = result.xpath('ProcedureType').text
      project.update(
        key: result.xpath('Key').text,
        raw_title: result.xpath('ProjectName').text,
        description: result.xpath('ProjectDescription').text.strip,
        organization_name: result.xpath('OrganizationName').text,
        lg_code: result.xpath('LgCode').text,
        prefecture_name: result.xpath('PrefectureName').text,
        city_code: result.xpath('CityCode').text,
        city_name: result.xpath('CityName').text,
        procedure_type: procedure_type,
        procedure_type_group: Project.determine_procedure_type_group(procedure_type),
        source: source,
        external_document_url: result.xpath('ExternalDocumentURI').text,
        publication_date: result.xpath('CftIssueDate').text.presence || Time.zone.today,
        registration_date: result.xpath('Date').text,
        bidding_deadline_date: result.xpath('TenderSubmissionDeadline').text,
        tender_opening_date: result.xpath('OpeningTendersEvent').text,
        delivery_deadline_date: result.xpath('PeriodEndTime').text
      )
      code = result.xpath('LgCode').text
      project.lg_codes.create(code: code) if code.present?

      # 調達ポータルのURLの場合はダウンロードしないようにする
      external_document_uri = result.xpath('ExternalDocumentURI').text
      unless external_document_uri == 'https://www.p-portal.go.jp/pps-web-biz/UAA01/OAA0101'
        project.download_and_attach_document(result.xpath('ExternalDocumentURI').text)
      end
      result.xpath('Attachments/Attachment').each do |attachment|
        attachment_url = attachment.xpath('Uri').text
        next if attachment_url.blank?

        filename = attachment.xpath('Name').text
        project.download_and_attach_document(attachment_url, filename)
      end
    end
  end
end
