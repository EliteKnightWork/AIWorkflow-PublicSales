# == Schema Information
#
# Table name: bid_pipelines
# Database name: primary
#
#  id                                   :bigint           not null, primary key
#  created_at                           :datetime         not null
#  updated_at                           :datetime         not null
#  bid_pipeline_status_id(ステータスID) :bigint           not null
#  company_id(企業ID)                   :bigint           not null
#  project_id(案件ID)                   :bigint           not null
#
# Indexes
#
#  index_bid_pipelines_on_bid_pipeline_status_id     (bid_pipeline_status_id)
#  index_bid_pipelines_on_company_id                 (company_id)
#  index_bid_pipelines_on_company_id_and_project_id  (company_id,project_id) UNIQUE
#  index_bid_pipelines_on_project_id                 (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (bid_pipeline_status_id => bid_pipeline_statuses.id)
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (project_id => projects.id)
#
class BidPipeline < ApplicationRecord
  belongs_to :project
  belongs_to :company
  belongs_to :status, class_name: 'BidPipelineStatus', foreign_key: 'bid_pipeline_status_id', inverse_of: :bid_pipelines
  has_many :bid_pipeline_assignments, dependent: :destroy
  has_many :assigned_users, through: :bid_pipeline_assignments, source: :user
  has_many :tasks, class_name: 'BidPipelineTask', dependent: :destroy, inverse_of: :bid_pipeline
  has_many :calendar_events, as: :registrable, dependent: :destroy
  has_many :custom_objects, dependent: :destroy
  has_one :upcomming_task, -> {
    joins(:status).where.not(bid_pipeline_task_statuses: { stage: 'done' }).order(due_date: :asc)
  }, class_name: 'BidPipelineTask', dependent: :destroy, inverse_of: :bid_pipeline

  validates :project_id, uniqueness: { scope: :company_id }

  after_create :create_custom_objects_from_templates

  def self.build_with_params(company:, create_params:)
    pipeline = BidPipeline.new(company: company)

    pipeline.project = Project.for_company(company&.id).find_by(uuid: create_params[:project_uuid])

    if create_params[:bid_pipeline_status_id].present?
      pipeline.status = company.bid_pipeline_statuses.find(create_params[:bid_pipeline_status_id])
    else
      target_status = company.bid_pipeline_statuses
                            .where(stage: 'doing')
                            .order(:order)
                            .first

      pipeline.status = target_status
    end

    if create_params[:assigned_user_ids].present?
      pipeline.bid_pipeline_assignments = create_params[:assigned_user_ids].filter_map do |user_id|
        user = User.find(user_id)
        next unless user.company == company

        BidPipelineAssignment.new(user_id: user_id)
      end
    end

    pipeline
  end

  def update_with_params(update_params)
    update_targets = {}

    if update_params[:bid_pipeline_status_id].present?
      update_targets[:status] = company.bid_pipeline_statuses.find(update_params[:bid_pipeline_status_id])
    end

    ActiveRecord::Base.transaction do
      if update_params.key?(:assigned_user_ids)
        bid_pipeline_assignments.destroy_all
        if update_params[:assigned_user_ids].present?
          update_targets[:bid_pipeline_assignments] = update_params[:assigned_user_ids].filter_map do |user_id|
            user = User.find(user_id)
            next unless user.company == company

            BidPipelineAssignment.new(user_id: user_id)
          end
        end
      end

      update!(update_targets)
    end
  end

  private

  def create_custom_objects_from_templates
    company.custom_object_templates.each do |template|
      custom_objects.create!(custom_object_template: template)
    end
  end
end
