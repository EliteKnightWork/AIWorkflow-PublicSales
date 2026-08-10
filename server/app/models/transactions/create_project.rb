module Transactions
  class CreateProject < ApplicationTransaction
    attr_reader :project

    def initialize(args, is_company_project: false)
      super()
      @args = args
      @project = nil
      @is_company_project = is_company_project
    end

    def exec
      with_transaction do
        # TODO: スクレイピング側を修正してexternal_document_urlを使うようにする
        external_document_url = @args[:external_document_url].presence || @args[:external_document_uri].presence

        project_params = {
          key: @args[:key],
          raw_title: @args[:raw_title].presence || @args[:title].presence,
          description: @args[:description],
          organization_name: @args[:organization_name],
          prefecture_name: @args[:prefecture],
          procedure_type: @args[:procedure_type],
          procedure_type_group: Project.determine_procedure_type_group(@args[:procedure_type]),
          source: @args[:source],
          publication_date: @args[:publication_date],
          registration_date: @args[:registration_date].presence || Time.zone.now.to_date,
          briefing_session_date: @args[:briefing_session_date],
          application_document_deadline_date: @args[:application_document_deadline_date],
          proposal_document_deadline_date: @args[:proposal_document_deadline_date],
          bidding_deadline_date: @args[:bidding_deadline_date],
          tender_opening_date: @args[:tender_opening_date],
          delivery_deadline_date: @args[:delivery_deadline_date],
          external_document_url: external_document_url,
          participation_qualification: @args[:participation_qualification],
          planned_price: @args[:planned_price],
          is_office_required: @args[:is_office_required],
          summary: @args[:summary],
        }

        project_params[:is_backfilled] = @args[:is_backfilled] if @args[:is_backfilled].present?
        project_params[:is_experience_required] = @args[:is_experience_required] if @args[:is_experience_required].present?

        @project = Project.new(project_params)
        @project.allow_future_publication_date = true if @is_company_project

        if !@is_company_project && @args[:organization_name].present?
          organization = Organization.find_or_initialize_by(name: @args[:organization_name])
          save_in_transaction(organization)
          @project.organization = organization
        end

        save_in_transaction(@project)
        return false if @errors.present?

        Array(@args[:attachments]).each do |attachment|
          external_document = @project.external_documents.build
          external_document.file.attach(io: attachment, filename: attachment.original_filename)
          save_in_transaction(external_document)
        end

        Array(@args[:screenshots]).each do |screenshot_hash|
          screenshot = @project.screenshots.build(source_url: screenshot_hash[:source_url])
          screenshot.file.attach(io: screenshot_hash[:file], filename: screenshot_hash[:file].original_filename)
          save_in_transaction(screenshot)
        end

        if @args[:prefectures].present?
          @args[:prefectures].each do |prefecture|
            lg_code = LgCodeConverter.to_code(prefecture)
            save_in_transaction(@project.lg_codes.build(code: lg_code)) if lg_code.present?
          end
        elsif @args[:prefecture].present?
          lg_code = LgCodeConverter.to_code(@args[:prefecture])
          save_in_transaction(@project.lg_codes.build(code: lg_code)) if lg_code.present?
        end

        Array(@args[:grades]).each do |grade|
          save_in_transaction(@project.project_grades.build(grade: grade))
        end

        Array(@args[:project_security_qualifications]).each do |security_qualification|
          save_in_transaction(@project.project_security_qualifications.build(security_qualification: security_qualification))
        end

        Array(@args[:participate_qualification_grade_ids]).each do |grade_id|
          save_in_transaction(@project.project_participate_qualification_grades.build(participate_qualification_grade_id: grade_id))
        end
      end
    end
  end
end
