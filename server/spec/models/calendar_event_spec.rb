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
require 'rails_helper'

RSpec.describe CalendarEvent, type: :model do
  describe 'validations' do
    let(:bid_pipeline) { create(:bid_pipeline) }
    let(:calendar_event) { create(:calendar_event, registrable: bid_pipeline) }

    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:registrable) }
    it { is_expected.to validate_presence_of(:provider) }
    it { is_expected.to validate_presence_of(:sync_status) }
    it { is_expected.to validate_inclusion_of(:sync_status).in_array(%w[syncing synced syncing_failed]) }
    it { is_expected.to validate_presence_of(:due_date_type) }
    it { is_expected.to validate_inclusion_of(:due_date_type).in_array(%w[application_document_deadline_date proposal_document_deadline_date bidding_deadline_date task_deadline_date]) }
    it { is_expected.to validate_presence_of(:start_time) }
    it { is_expected.to validate_presence_of(:duration_minutes) }
    it { is_expected.to validate_numericality_of(:duration_minutes).only_integer.is_greater_than(0) }

    it do
      expect(calendar_event).to validate_uniqueness_of(:due_date_type)
        .scoped_to(:user_id, :registrable_type, :registrable_id)
        .ignoring_case_sensitivity
        .with_message('はすでに存在します')
    end
  end
end
