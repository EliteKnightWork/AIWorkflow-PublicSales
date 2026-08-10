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
FactoryBot.define do
  factory :proposal_document do
    company
    user

    after(:build) do |proposal_document|
      proposal_document.file.attach(
        io: Rails.root.join('spec/fixtures/files/test.pptx').open,
        filename: 'test.pptx',
        content_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      )
    end
  end
end
