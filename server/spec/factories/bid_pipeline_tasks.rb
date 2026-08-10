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
FactoryBot.define do
  factory :bid_pipeline_task do
    bid_pipeline
    status factory: %i[bid_pipeline_task_status]
    sequence(:title) { |n| "タスク#{n}" }
    description { "タスクの説明文です" }
    due_date { Date.current + 7.days }
  end
end
