# == Schema Information
#
# Table name: browsing_histories
# Database name: primary
#
#  id                     :bigint           not null, primary key
#  browsable_type         :string(255)      not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  browsable_id(既読対象) :bigint           not null
#  user_id(ユーザーID)    :bigint           not null
#
# Indexes
#
#  idx_on_user_id_browsable_type_browsable_id_ff2628d1c2        (user_id,browsable_type,browsable_id) UNIQUE
#  index_browsing_histories_on_browsable_type_and_browsable_id  (browsable_type,browsable_id)
#  index_browsing_histories_on_user_id                          (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :browsing_history do
    user { nil }
    browsable { nil }
  end
end
