# == Schema Information
#
# Table name: company_attachments
# Database name: primary
#
#  id                    :bigint           not null, primary key
#  file_type(資料の形式) :string(255)
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#  company_id(会社ID)    :bigint           not null
#
# Indexes
#
#  index_company_attachments_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :company_attachment do
    company
    file_type { :others }

    after(:build) do |attachment|
      attachment.file.attach(
        io: Rails.root.join('spec/fixtures/files/test.pdf').open,
        filename: 'test.pdf',
        content_type: 'application/pdf'
      )
    end
  end
end
