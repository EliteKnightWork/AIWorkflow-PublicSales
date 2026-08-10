# == Schema Information
#
# Table name: bidders
# Database name: primary
#
#  id                             :bigint           not null, primary key
#  is_successful(落札者フラグ)    :boolean          default(FALSE), not null
#  created_at                     :datetime
#  updated_at                     :datetime
#  awarded_project_id(落札情報ID) :bigint           not null
#  bid_company_id(企業ID)         :bigint           not null
#
# Indexes
#
#  index_bidders_on_awarded_project_id  (awarded_project_id)
#  index_bidders_on_bid_company_id      (bid_company_id)
#
# Foreign Keys
#
#  fk_rails_...  (awarded_project_id => awarded_projects.id)
#  fk_rails_...  (bid_company_id => bid_companies.id)
#
class Bidder < ApplicationRecord
  belongs_to :bid_company
  belongs_to :awarded_project

  validates :is_successful, inclusion: { in: [true, false] }
end
