# == Schema Information
#
# Table name: bid_pipeline_assignments
# Database name: primary
#
#  id                                  :bigint           not null, primary key
#  created_at                          :datetime         not null
#  updated_at                          :datetime         not null
#  bid_pipeline_id(入札パイプラインID) :bigint           not null
#  user_id(ユーザーID)                 :bigint           not null
#
# Indexes
#
#  index_bid_pipeline_assignments_on_bid_pipeline_id              (bid_pipeline_id)
#  index_bid_pipeline_assignments_on_bid_pipeline_id_and_user_id  (bid_pipeline_id,user_id) UNIQUE
#  index_bid_pipeline_assignments_on_user_id                      (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (bid_pipeline_id => bid_pipelines.id)
#  fk_rails_...  (user_id => users.id)
#
require 'rails_helper'

RSpec.describe BidPipelineAssignment, type: :model do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:project) { create(:project) }
  let(:status) { create(:bid_pipeline_status, company: company) }
  let(:bid_pipeline) { create(:bid_pipeline, company: company, project: project, status: status) }
  let(:user_with_company) { create(:user, company: company) }
  let(:user_with_other_company) { create(:user, company: other_company) }

  context '同一企業のユーザーが割り当てられた場合' do
    let(:assignment) { described_class.new(bid_pipeline: bid_pipeline, user: user_with_company) }

    it '同一企業のユーザーは有効' do
      expect(assignment).to be_valid
    end
  end

  context '異なる企業のユーザーが割り当てられた場合' do
    let(:assignment) { described_class.new(bid_pipeline: bid_pipeline, user: user_with_other_company) }

    it '異なる企業のユーザーは無効' do
      expect(assignment).to be_invalid
    end
  end
end
