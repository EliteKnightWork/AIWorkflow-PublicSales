require 'time'

module V1
  class ProjectSerializer < ActiveModel::Serializer
    has_many :external_documents, key: :attachments, serializer: V1::ExternalDocumentSerializer
    has_many :screenshots, serializer: V1::ScreenshotSerializer
    has_one :awarded_project, serializer: V1::AwardedProjectSerializer

    attribute :type do
      object.awarded_project.present? ? 'awarded_project' : 'project'
    end

    attribute :uuid do
      object.uuid
    end

    attribute :key do
      object.key
    end

    attribute :title do
      object.title
    end

    attribute :raw_title do
      object.raw_title
    end

    attribute :highlighted_title do
      object.highlighted_title
    end

    attribute :organization_name do
      object.organization_name
    end

    attribute :prefecture do
      object.prefecture_name
    end

    attribute :prefectures do
      object.decorate.prefectures
    end

    attribute :procedure_type do
      object.procedure_type
    end

    attribute :procedure_type_group do
      object.procedure_type_group
    end

    attribute :source do
      object.source
    end

    attribute :publication_date do
      object.decorate.publication_date
    end

    attribute :description do
      object.description
    end

    attribute :summary do
      object.summary
    end

    attribute :bidding_deadline_date do
      object.decorate.bidding_deadline_date
    end

    attribute :briefing_session_date do
      object.decorate.briefing_session_date
    end

    attribute :application_document_deadline_date do
      object.decorate.application_document_deadline_date
    end

    attribute :proposal_document_deadline_date do
      object.decorate.proposal_document_deadline_date
    end

    attribute :document_url do
      object.external_document_url
    end

    attribute :is_new_arrival do
      object.decorate.is_new_arrival
    end

    attribute :is_favorite do
      object.decorate.is_favorite?(@instance_options[:current_user])
    end

    attribute :is_summarized do
      object.decorate.is_summarized?(@instance_options[:current_user])
    end

    attribute :hidden_at do
      object.decorate.hidden_at
    end

    attribute :planned_price do
      object.decorate.planned_price
    end

    attribute :is_experience_required do
      object.is_experience_required
    end

    attribute :is_office_required do
      object.is_office_required
    end

    attribute :project_security_qualifications do
      object.project_security_qualifications&.map(&:security_qualification)
    end

    attribute :has_browsed do
      object.decorate.has_browsed?(@instance_options[:current_user])
    end

    attribute :registration_date do
      object.decorate.registration_date
    end

    attribute :bid_pipeline do
      @instance_options[:current_user].nil? ? nil : begin
        return nil if @instance_options[:current_user].company.nil?
        pipeline = object.bid_pipeline_for_company(@instance_options[:current_user].company)
        pipeline.present? ? ActiveModelSerializers::SerializableResource.new(pipeline, serializer: V1::ProjectBidPipelineSerializer) : nil
      end
    end

    attribute :participate_qualification_grades do
      object.participate_qualification_grades.empty? ? [] : begin
        grouped = object.participate_qualification_grades
          .group_by(&:participate_qualification_id)
          .map do |participate_qualification_id, grades|
            participate_qualification = ParticipateQualification.find(participate_qualification_id)
            participate_qualification.define_singleton_method(:participate_qualification_grades) { grades }
            participate_qualification
          end

        ActiveModelSerializers::SerializableResource.new(
          grouped,
          each_serializer: V1::ParticipateQualificationSerializer
        )
      end
    end

    attribute :tender_opening_date do
      object.tender_opening_date
    end

    attribute :company_project_id do
      object.company_project_id
    end

    attribute :reaction do
      reaction_record = @instance_options[:current_user]&.project_reactions&.find_by(project: object)
      reaction_record&.reaction
    end

    attribute :reacted_by_list, if: :include_reacted_by_list? do
      # 事前にロードされたproject_reactionsを使用してN+1問題を回避
      user_ids = @instance_options[:users]&.map(&:id) || []
      reaction_type = @instance_options[:reaction_type] || 'like'
      object.project_reactions
        .select { |r| r.reaction == reaction_type && user_ids.include?(r.user_id) }
        .map { |r| r.user.name.presence || r.user.email }
    end

    def include_reacted_by_list?
      instance_options[:include_reacted_by_list] || false
    end
  end

end
