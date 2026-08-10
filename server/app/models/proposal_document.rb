# == Schema Information
#
# Table name: proposal_documents
# Database name: primary
#
#  id                            :bigint           not null, primary key
#  created_at                    :datetime         not null
#  updated_at                    :datetime         not null
#  company_id(企業ID)            :bigint           not null
#  user_id(リクエストユーザーID) :bigint           not null
#
# Indexes
#
#  index_proposal_documents_on_company_id  (company_id)
#  index_proposal_documents_on_user_id     (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
class ProposalDocument < ApplicationRecord
  belongs_to :company
  belongs_to :user
  has_one_attached :file

  validates :file, presence: true
end
