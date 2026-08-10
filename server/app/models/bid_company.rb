# == Schema Information
#
# Table name: bid_companies
# Database name: primary
#
#  id           :bigint           not null, primary key
#  name(企業名) :string(255)      not null
#  created_at   :datetime
#  updated_at   :datetime
#
# Indexes
#
#  index_bid_companies_on_name  (name) UNIQUE
#
class BidCompany < ApplicationRecord
  has_many :bidders, dependent: :destroy

  validates :name, presence: true
end
