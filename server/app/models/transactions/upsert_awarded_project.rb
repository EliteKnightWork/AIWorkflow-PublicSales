module Transactions
  class UpsertAwardedProject < ApplicationTransaction
    def initialize(args)
      super()
      @args = args
    end

    def exec
      with_transaction do
        codes = Array(@args[:prefectures] || @args[:prefecture]).map { LgCodeConverter.to_code(_1) }.compact
        organization = find_or_create_organization

        project = find_or_initialize_project(codes)
        project.assign_attributes(project_params)
        project.organization = organization
        project.skip_check_date_callback = true

        # tender_opening_dateが未来日の場合は空に変換しておく
        if project.tender_opening_date.present? && project.tender_opening_date > Time.zone.today
          project.tender_opening_date = nil
        end

        save_in_transaction(project)
        return false if @errors.present?

        awarded_project = project.awarded_project || project.build_awarded_project
        awarded_project.assign_attributes(awarded_project_params)
        awarded_project.organization = organization
        save_in_transaction(awarded_project)

        recreate_associated_records(project)
      end
    end

    private

    def find_or_initialize_project(codes)
      if @args[:key].present?
        matching_projects = Project.for_company(nil).where(
          key: @args[:key],
          source: @args[:source]
        )
      else
        matching_projects = Project.for_company(nil).joins(:awarded_project).where(
          title: @args[:title],
          procedure_type: @args[:procedure_type],
          city_name: @args[:city],
          awarded_project: {
            url: @args[:url],
          }
        )
      end

      if codes.empty?
        # lg_codesが空の場合：lg_codesを持たないレコードを探す
        existing_project = matching_projects.left_joins(:lg_codes)
          .where(project_lg_codes: { id: nil })
          .first
      else
        # lg_codesが存在する場合：完全一致するレコードを探す
        existing_project = matching_projects.joins(:lg_codes)
          .where(project_lg_codes: { code: codes })
          .group('projects.id')
          .having('COUNT(DISTINCT project_lg_codes.code) = ?', codes.size)
          .having('COUNT(project_lg_codes.id) = ?', codes.size)
          .first
      end
      return existing_project if existing_project.present?

      Project.new(
        title: @args[:title],
        procedure_type: @args[:procedure_type],
        city_name: @args[:city],
      )
    end

    def project_params
      {
        raw_title: @args[:title],
        key: key,
        ulid: @args[:ulid],
        organization_name: @args[:organization_name],
        prefecture_name: @args[:prefecture],
        city_name: @args[:city],
        procedure_type: @args[:procedure_type],
        procedure_type_group: Project.determine_procedure_type_group(@args[:procedure_type]),
        source: @args[:source],
        planned_price: @args[:planned_price],
        tender_opening_date: @args[:tender_opening_datetime]&.to_date,
        registration_date: @args[:registration_date]&.to_date || Time.zone.today,
      }
    end

    def awarded_project_params
      params = {
        url: @args[:url],
        successful_bid_price: @args[:successful_bid_price],
        source: @args[:source],
      }
      params[:is_unsuccessful] = @args[:is_unsuccessful] if @args[:is_unsuccessful].present?
      params
    end

    def key
      # 明示的にkeyが指定されている場合はそれを使用
      return @args[:key] if @args[:key].present?

      # keyが指定されていない場合は自動生成
      codes = Array(@args[:prefectures] || @args[:prefecture]).map { LgCodeConverter.to_code(_1) }.compact
      Project.build_key(
        title: @args[:title],
        procedure_type: @args[:procedure_type],
        city: @args[:city],
        url: @args[:url],
        lg_codes: codes,
      )
    end

    def recreate_associated_records(project)
      recreate_bidders(project)
      recreate_attachments(project)
      recreate_screenshots(project)
      recreate_source_files(project)
      recreate_prefectures(project)
    end

    def recreate_bidders(project)
      project.awarded_project.bidders.each { destroy_in_transaction(_1) }

      (@args[:bidders].presence || []).each do |bidder|
        bid_company = BidCompany.find_or_create_by(name: bidder[:company_name])
        bidder = project.awarded_project.bidders.build(bid_company_id: bid_company.id, is_successful: bidder[:is_successful_bidder] || false)
        save_in_transaction(bid_company)
        save_in_transaction(bidder)
      end
    end

    def recreate_attachments(project)
      return if @args[:attachments].blank?

      project.external_documents.each { destroy_in_transaction(_1) }

      (@args[:attachments].presence || []).each do |attachment|
        external_document = project.external_documents.build
        external_document.file.attach(io: attachment, filename: attachment.original_filename)
        save_in_transaction(external_document)
      end
    end

    def recreate_screenshots(project)
      return if @args[:screenshots].blank?
      project.screenshots.each { destroy_in_transaction(_1) }

      (@args[:screenshots].presence || []).each do |screenshot_hash|
        screenshot = project.screenshots.build(source_url: screenshot_hash[:source_url])
        screenshot.file.attach(io: screenshot_hash[:file], filename: screenshot_hash[:file].original_filename)
        save_in_transaction(screenshot)
      end
    end

    def recreate_source_files(project)
      return if @args[:source_files].blank?
      project.source_files.each { destroy_in_transaction(_1) }

      (@args[:source_files].presence || []).each do |source_file_blob|
        source_file = project.source_files.build
        source_file.file.attach(io: source_file_blob, filename: source_file_blob.original_filename)
        save_in_transaction(source_file)
      end
    end

    def recreate_prefectures(project)
      return if @args[:prefectures].blank? and @args[:prefecture].blank?
      project.lg_codes.each { destroy_in_transaction(_1) }

      # TODO: prefecture -> prefecturesにAPI側を修正したらprefecturesのみを使うようにする
      (@args[:prefectures].presence || [@args[:prefecture]].compact_blank || []).each do |prefecture|
        code = LgCodeConverter.to_code(prefecture)
        if code
          lg_code = project.lg_codes.find_or_initialize_by(code: code)
          save_in_transaction(lg_code)
        end
      end
    end

    def find_or_create_organization
      return if @args[:organization_name].blank?

      organization = Organization.find_or_initialize_by(name: @args[:organization_name])
      save_in_transaction(organization)
      organization
    end
  end
end
