# == Schema Information
#
# Table name: offices
# Database name: primary
#
#  id                 :bigint           not null, primary key
#  address(住所)      :string(255)      not null
#  name(事業所名)     :string(255)      not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  company_id(会社ID) :bigint           not null
#
# Indexes
#
#  index_offices_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
class Office < ApplicationRecord
  belongs_to :company

  validates :name, :address, length: { maximum: 255 }, presence: true
end
