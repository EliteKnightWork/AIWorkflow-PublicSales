# == Schema Information
#
# Table name: search_filter_preset_notifications
# Database name: primary
#
#  id                                  :bigint           not null, primary key
#  created_at                          :datetime         not null
#  updated_at                          :datetime         not null
#  search_filter_preset_id(検索条件ID) :bigint           not null
#  user_id(ユーザーID)                 :bigint           not null
#
# Indexes
#
#  idx_on_search_filter_preset_id_25e4f8c430            (search_filter_preset_id)
#  index_search_filter_preset_notifications_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (search_filter_preset_id => search_filter_presets.id)
#  fk_rails_...  (user_id => users.id)
#
class SearchFilterPresetNotification < ApplicationRecord
  belongs_to :user
  belongs_to :search_filter_preset

  validate :check_limitation

  private

  def check_limitation
    # TODO: LABID-613が完了したらデフォルト値を削除
    limit = self.user.company&.company_functional_limitation&.max_search_filter_preset_notification_count || CompanyFunctionalLimitation::DEFAULT_MAX_SEARCH_FILTER_PRESET_NOTIFICATION_COUNT

    current_notifications = self.user.search_filter_preset_notifications
    current_notifications = current_notifications.where.not(id: self.id) if self.persisted?
    return if current_notifications.count < limit

    errors.add(:base, "配信登録の上限数#{limit}件に達しています")
  end
end
