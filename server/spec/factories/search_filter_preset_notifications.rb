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
FactoryBot.define do
  factory :search_filter_preset_notification do
    user
    search_filter_preset
  end
end
