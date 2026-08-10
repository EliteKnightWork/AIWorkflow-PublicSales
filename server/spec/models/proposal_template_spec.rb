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
require 'rails_helper'

RSpec.describe ProposalTemplate, type: :model do
  describe 'associations' do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to have_one_attached(:file) }
  end

  describe 'validations' do
    it { is_expected.to validate_presence_of(:file) }
  end

  describe '#acceptable_file_format' do
    let(:company) { create(:company) }
    let(:proposal_template) { build(:proposal_template, company: company) }

    context 'with valid file formats' do
      it 'allows PowerPoint .ppt files' do
        file = fixture_file_upload(Rails.root.join('spec/fixtures/files/test.ppt'), 'application/vnd.ms-powerpoint')
        proposal_template.file.attach(file)
        expect(proposal_template).to be_valid
      end

      it 'allows PowerPoint .pptx files' do
        file = fixture_file_upload(Rails.root.join('spec/fixtures/files/test.pptx'), 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
        proposal_template.file.attach(file)
        expect(proposal_template).to be_valid
      end
    end

    context 'with invalid file formats' do
      it 'rejects PDF files' do
        file = fixture_file_upload(Rails.root.join('spec/fixtures/files/test.pdf'), 'application/pdf')
        proposal_template.file.attach(file)
        expect(proposal_template).not_to be_valid
        expect(proposal_template.errors[:file]).to include('はPowerPointファイル（.ppt, .pptx）のみ許可されています')
      end

      it 'rejects image files' do
        file = fixture_file_upload(Rails.root.join('spec/fixtures/files/test.jpg'), 'image/jpeg')
        proposal_template.file.attach(file)
        expect(proposal_template).not_to be_valid
        expect(proposal_template.errors[:file]).to include('はPowerPointファイル（.ppt, .pptx）のみ許可されています')
      end

      it 'rejects text files' do
        file = fixture_file_upload(Rails.root.join('spec/fixtures/files/test.txt'), 'text/plain')
        proposal_template.file.attach(file)
        expect(proposal_template).not_to be_valid
        expect(proposal_template.errors[:file]).to include('はPowerPointファイル（.ppt, .pptx）のみ許可されています')
      end
    end
  end
end
