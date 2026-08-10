# == Schema Information
#
# Table name: organizations
# Database name: primary
#
#  id           :bigint           not null, primary key
#  name(組織名) :string(255)      not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
# Indexes
#
#  index_organizations_on_name  (name) UNIQUE
#
class Organization < ApplicationRecord
  include OrganizationSearchable

  has_many :projects, dependent: :nullify
  has_many :awarded_projects, dependent: :nullify

  validates :name, presence: true, uniqueness: true
  
  # Elastic Searchの結果から設定される属性
  attr_accessor :open_projects_count, :bidded_projects_count, :total_projects_count
end
