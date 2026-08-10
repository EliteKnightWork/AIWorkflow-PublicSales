# == Schema Information
#
# Table name: company_participate_qualification_grades
# Database name: primary
#
#  id                                                   :bigint           not null, primary key
#  created_at                                           :datetime         not null
#  updated_at                                           :datetime         not null
#  company_participate_qualification_id(企業参加資格ID) :bigint           not null
#  participate_qualification_grade_id(参加資格等級ID)   :bigint           not null
#
# Indexes
#
#  idx_on_company_participate_qualification_id_2847a3d766          (company_participate_qualification_id)
#  idx_on_participate_qualification_grade_id_7c0c96103b            (participate_qualification_grade_id)
#  idx_on_participate_qualification_grade_id_company_p_db03067e85  (participate_qualification_grade_id,company_participate_qualification_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_participate_qualification_id => company_participate_qualifications.id)
#  fk_rails_...  (participate_qualification_grade_id => participate_qualification_grades.id)
#
FactoryBot.define do
  factory :company_participate_qualification_grade do
    company_participate_qualification
    participate_qualification_grade
  end
end
