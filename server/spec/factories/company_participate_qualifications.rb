# == Schema Information
#
# Table name: company_participate_qualifications
# Database name: primary
#
#  id                                       :bigint           not null, primary key
#  organization_name(機関名)                :string(255)      not null
#  qualification_status(資格状態)           :string(255)      not null
#  qualification_type(資格種別)             :string(255)      not null
#  remarks(備考)                            :text(65535)
#  valid_from(認証有効開始日)               :date             not null
#  valid_until(認証有効終了日)              :date             not null
#  created_at                               :datetime         not null
#  updated_at                               :datetime         not null
#  company_id(企業ID)                       :bigint           not null
#  participate_qualification_id(参加資格ID) :bigint           not null
#
# Indexes
#
#  idx_on_participate_qualification_id_5815bbe543          (participate_qualification_id)
#  index_company_participate_qualifications_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (participate_qualification_id => participate_qualifications.id)
#
FactoryBot.define do
  factory :company_participate_qualification do
    company
    participate_qualification

    organization_name { Faker::Company.name }
    qualification_type { CompanyParticipateQualification.qualification_types.keys.sample }
    qualification_status { CompanyParticipateQualification.qualification_statuses.keys.sample }
    valid_from { Time.zone.today - 1.year }
    valid_until { Time.zone.today + 1.year }
    remarks { Faker::Lorem.sentence }
  end
end
