# == Schema Information
#
# Table name: participate_qualifications
# Database name: primary
#
#  id                                           :bigint           not null, primary key
#  county(郡)                                   :string(255)
#  lg_code(都道府県コード)                      :string(255)
#  municipality(市区町村)                       :string(255)
#  name(参加資格名)                             :string(255)      not null
#  participate_qualification_type(参加資格種別) :string(255)      not null
#  prefecture(都道府県)                         :string(255)
#  prefecture_or_none                           :string(255)      not null
#  created_at                                   :datetime         not null
#  updated_at                                   :datetime         not null
#
# Indexes
#
#  idx_on_prefecture_or_none_name_1c359ef555  (prefecture_or_none,name) UNIQUE
#
FactoryBot.define do
  factory :participate_qualification do
    sequence(:name) { |n| "参加資格_#{n}" }
    participate_qualification_type { '都道府県' }
    prefecture { '東京都' }
    lg_code { '13' }
    county { nil }
    municipality { nil }
  end
end
