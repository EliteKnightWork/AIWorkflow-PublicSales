# == Schema Information
#
# Table name: bid_pipeline_statuses
# Database name: primary
#
#  id                            :bigint           not null, primary key
#  is_uneditable(編集不可フラグ) :boolean          default(FALSE), not null
#  name(ステータス名)            :string(255)      not null
#  order(表示順)                 :integer          default(0), not null
#  stage(ステージ(doing, done))  :string(255)      default("doing"), not null
#  created_at                    :datetime         not null
#  updated_at                    :datetime         not null
#  company_id(企業ID)            :bigint           not null
#
# Indexes
#
#  index_bid_pipeline_statuses_on_company_id                      (company_id)
#  index_bid_pipeline_statuses_on_company_id_and_name             (company_id,name) UNIQUE
#  index_bid_pipeline_statuses_on_company_id_and_stage_and_order  (company_id,stage,order) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :bid_pipeline_status do
    sequence(:name) { |n| "ステータス_#{n}" }
    stage { 'doing' }
    order { 1 }
    is_uneditable { false }
    company
  end
end
