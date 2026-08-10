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
class CalendarEvent < ApplicationRecord
  belongs_to :user
  belongs_to :registrable, polymorphic: true, inverse_of: :calendar_events

  validates :provider, presence: true
  validates :sync_status, presence: true, inclusion: { in: %w[syncing synced syncing_failed] }
  validates :due_date_type, presence: true, inclusion: { in: %w[application_document_deadline_date proposal_document_deadline_date bidding_deadline_date task_deadline_date] }
  validates :start_time, presence: true
  validates :duration_minutes, presence: true, numericality: { only_integer: true, greater_than: 0 }

  validates :due_date_type, uniqueness: { scope: [:user_id, :registrable_type, :registrable_id] }

  def self.ja_due_date_types
    {
      'application_document_deadline_date' => '参加申し込み期日',
      'proposal_document_deadline_date' => '提案書期日',
      'bidding_deadline_date' => '入札日',
      'task_deadline_date' => 'タスク期日',
    }
  end

  def destroy_with_external_calendar_event!
    token = self.user.user_tokens.find_by(token_provider: self.provider)

    service = case self.provider
    when 'google_oauth2'
      GoogleCalendarService.new(token)
    when 'microsoft_graph'
      MicrosoftCalendarService.new(token)
    end

    return unless service

    service.delete_event(self.event_id)
    self.destroy!
  end
end
