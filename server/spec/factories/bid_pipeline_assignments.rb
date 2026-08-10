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
FactoryBot.define do
  factory :bid_pipeline_assignment do
    bid_pipeline
    user
  end
end
