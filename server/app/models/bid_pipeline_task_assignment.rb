# == Schema Information
#
# Table name: bid_pipeline_task_assignments
# Database name: primary
#
#  id                                             :bigint           not null, primary key
#  created_at                                     :datetime         not null
#  updated_at                                     :datetime         not null
#  bid_pipeline_task_id(入札パイプラインタスクID) :bigint           not null
#  user_id(ユーザーID)                            :bigint           not null
#
# Indexes
#
#  idx_on_bid_pipeline_task_id_user_id_cc9a72f1ff               (bid_pipeline_task_id,user_id) UNIQUE
#  index_bid_pipeline_task_assignments_on_bid_pipeline_task_id  (bid_pipeline_task_id)
#  index_bid_pipeline_task_assignments_on_user_id               (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (bid_pipeline_task_id => bid_pipeline_tasks.id)
#  fk_rails_...  (user_id => users.id)
#
class BidPipelineTaskAssignment < ApplicationRecord
  belongs_to :bid_pipeline_task
  belongs_to :user

  validates :user_id, uniqueness: { scope: :bid_pipeline_task_id }
  validate :user_belongs_to_same_company

  private

  def user_belongs_to_same_company
    return if user.nil? || bid_pipeline_task.nil?

    bid_pipeline = bid_pipeline_task.bid_pipeline
    return if bid_pipeline.nil?

    if user.company_id != bid_pipeline.company_id
      errors.add(:user_id, '同一企業のユーザーのみ割り当て可能です')
    end
  end
end
