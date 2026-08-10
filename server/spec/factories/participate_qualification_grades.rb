# == Schema Information
#
# Table name: participate_qualification_grades
# Database name: primary
#
#  id                                       :bigint           not null, primary key
#  name(等級名)                             :string(255)
#  order(順序)                              :integer          default(0), not null
#  created_at                               :datetime         not null
#  updated_at                               :datetime         not null
#  participate_qualification_id(参加資格ID) :bigint           not null
#
# Indexes
#
#  idx_on_participate_qualification_id_9c16869f34        (participate_qualification_id)
#  idx_on_participate_qualification_id_order_a74d2a83c4  (participate_qualification_id,order) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (participate_qualification_id => participate_qualifications.id)
#
FactoryBot.define do
  factory :participate_qualification_grade do
    participate_qualification
    sequence(:name) { |n| "等級#{n}" }
    sequence(:order) { |n| n }
  end
end
