# == Schema Information
#
# Table name: proposal_templates
# Database name: primary
#
#  id                 :bigint           not null, primary key
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  company_id(企業ID) :bigint           not null
#
# Indexes
#
#  index_proposal_templates_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :proposal_template do
    company

    after(:build) do |proposal_template|
      proposal_template.file.attach(
        io: Rails.root.join('spec/fixtures/files/test.pptx').open,
        filename: 'test.pptx',
        content_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      )
    end
  end
end
