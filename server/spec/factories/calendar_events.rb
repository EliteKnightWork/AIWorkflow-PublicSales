# == Schema Information
#
# Table name: calendar_events
# Database name: primary
#
#  id                                                                                                                  :bigint           not null, primary key
#  due_date_type(期日種別(application_document_deadline_date, proposal_document_deadline_date, bidding_deadline_date)) :string(255)      not null
#  duration_minutes(イベントの期間(分))                                                                                :integer          not null
#  provider(プロバイダー名)                                                                                            :string(255)      not null
#  registrable_type                                                                                                    :string(255)      not null
#  start_time(開始日時)                                                                                                :datetime         not null
#  sync_status(同期ステータス(syncing, synced, failed))                                                                :string(255)      not null
#  created_at                                                                                                          :datetime         not null
#  updated_at                                                                                                          :datetime         not null
#  event_id(イベントID)                                                                                                :string(255)
#  registrable_id(登録可能な対象(案件管理, 案件管理タスクなど))                                                        :bigint           not null
#  user_id(ユーザーID)                                                                                                 :bigint           not null
#
# Indexes
#
#  idx_on_user_id_registrable_type_registrable_id_due__6ee1f0bdfd  (user_id,registrable_type,registrable_id,due_date_type) UNIQUE
#  index_calendar_events_on_registrable_type_and_registrable_id    (registrable_type,registrable_id)
#  index_calendar_events_on_user_id                                (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :calendar_event do
    user
    provider { Faker::Internet.domain_name }
    registrable_type { "BidPipelines" } # Example type, adjust as necessary
    event_id { Faker::Alphanumeric.alphanumeric(number: 10) }
    sync_status { 'syncing' } # Default status, can be changed in tests
    registrable_id { Faker::Number.number(digits: 5) } # Adjust based on your model's requirements
    due_date_type { 'application_document_deadline_date' } # Example type, adjust as necessary
    start_time { 1.day.from_now } # Example start time, adjust as necessary
    duration_minutes { 60 } # Default duration of 1 hour, can be changed in tests

    created_at { Time.current }
    updated_at { Time.current }
  end
end
