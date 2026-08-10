# == Schema Information
#
# Table name: bid_pipeline_task_attachments
# Database name: primary
#
#  id                                             :bigint           not null, primary key
#  created_at                                     :datetime         not null
#  updated_at                                     :datetime         not null
#  bid_pipeline_task_id(入札パイプラインタスクID) :bigint           not null
#
# Indexes
#
#  index_bid_pipeline_task_attachments_on_bid_pipeline_task_id  (bid_pipeline_task_id)
#
# Foreign Keys
#
#  fk_rails_...  (bid_pipeline_task_id => bid_pipeline_tasks.id)
#
class BidPipelineTaskAttachment < ApplicationRecord
  include FileNameValidatable

  belongs_to :bid_pipeline_task
  has_one_attached :file

  validates :file, presence: true
end
