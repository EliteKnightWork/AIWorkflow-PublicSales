# == Schema Information
#
# Table name: bid_pipeline_tasks
# Database name: primary
#
#  id                                        :bigint           not null, primary key
#  description(詳細)                         :text(65535)
#  due_date(期日)                            :date
#  title(件名)                               :string(255)      not null
#  created_at                                :datetime         not null
#  updated_at                                :datetime         not null
#  bid_pipeline_id(入札パイプラインID)       :bigint           not null
#  bid_pipeline_task_status_id(ステータスID) :bigint           not null
#
# Indexes
#
#  index_bid_pipeline_tasks_on_bid_pipeline_id              (bid_pipeline_id)
#  index_bid_pipeline_tasks_on_bid_pipeline_task_status_id  (bid_pipeline_task_status_id)
#
# Foreign Keys
#
#  fk_rails_...  (bid_pipeline_id => bid_pipelines.id)
#  fk_rails_...  (bid_pipeline_task_status_id => bid_pipeline_task_statuses.id)
#
class BidPipelineTask < ApplicationRecord
  belongs_to :bid_pipeline, inverse_of: :tasks
  belongs_to :status, class_name: 'BidPipelineTaskStatus', foreign_key: :bid_pipeline_task_status_id, inverse_of: :bid_pipeline_tasks
  has_many :bid_pipeline_task_assignments, dependent: :destroy
  has_many :assigned_users, through: :bid_pipeline_task_assignments, source: :user, autosave: true
  has_many :attachments, class_name: 'BidPipelineTaskAttachment', dependent: :destroy, inverse_of: :bid_pipeline_task
  has_many :calendar_events, as: :registrable, dependent: :destroy

  validates :title, presence: true
  accepts_nested_attributes_for :attachments, allow_destroy: true

  scope :not_done, -> { joins(:status).where.not(bid_pipeline_task_statuses: { stage: :done }) }
end
