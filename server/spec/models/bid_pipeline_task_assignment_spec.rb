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
require 'rails_helper'

RSpec.describe BidPipelineTaskAssignment, type: :model do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:project) { create(:project) }
  let(:pipeline_status) { create(:bid_pipeline_status, company: company) }
  let(:bid_pipeline) { create(:bid_pipeline, company: company, project: project, status: pipeline_status) }
  let(:task_status) { create(:bid_pipeline_task_status, company: company) }
  let(:task) { create(:bid_pipeline_task, bid_pipeline: bid_pipeline, status: task_status) }
  let(:user_with_company) { create(:user, company: company) }
  let(:user_with_other_company) { create(:user, company: other_company) }

  context '同一企業のユーザーが割り当てられた場合' do
    let(:assignment) { described_class.new(bid_pipeline_task: task, user: user_with_company) }

    it '同一企業のユーザーは有効' do
      expect(assignment).to be_valid
    end
  end

  context '異なる企業のユーザーが割り当てられた場合' do
    let(:assignment) { described_class.new(bid_pipeline_task: task, user: user_with_other_company) }

    it '異なる企業のユーザーは無効' do
      expect(assignment).to be_invalid
    end
  end
end
