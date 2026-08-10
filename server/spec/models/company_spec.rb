# == Schema Information
#
# Table name: companies
# Database name: primary
#
#  id                               :bigint           not null, primary key
#  is_trial(トライアル契約かどうか) :boolean          default(FALSE), not null
#  name(企業名)                     :string(255)      not null
#  plan_name(プラン名)              :string(255)      default("Standard"), not null
#  created_at                       :datetime         not null
#  updated_at                       :datetime         not null
#
require 'rails_helper'

RSpec.describe Company, type: :model do
  describe 'validations' do
    subject { build(:company) }

    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:plan_name) }
  end

  describe 'associations' do
    let(:company) { create(:company) }

    it { is_expected.to have_many(:users).dependent(:restrict_with_exception) }
    it { is_expected.to have_many(:favorites).through(:users) }
    it { is_expected.to have_many(:favorite_projects).through(:favorites).source(:project) }
    it { is_expected.to have_many(:search_filter_presets).through(:users) }
    it { is_expected.to have_many(:project_summary_usages).dependent(:destroy) }
    it { is_expected.to have_many(:subscriptions).dependent(:destroy) }
    it { is_expected.to have_many(:business_description_formats).dependent(:destroy) }
    it { is_expected.to have_many(:bid_pipelines).dependent(:destroy) }
    it { is_expected.to have_many(:bid_pipeline_statuses).dependent(:delete_all) }
    it { is_expected.to have_many(:custom_object_templates).dependent(:destroy) }
    it { is_expected.to have_many(:offices).dependent(:destroy) }
    it { is_expected.to have_many(:company_attachments).dependent(:destroy) }
    it { is_expected.to have_many(:company_features).dependent(:destroy) }
    it { is_expected.to have_many(:features).through(:company_features) }
    it { is_expected.to have_one(:company_information).dependent(:destroy) }
    it { is_expected.to have_one(:company_functional_limitation).dependent(:destroy) }
    it { is_expected.to have_many(:company_security_qualifications).dependent(:destroy) }
    it { is_expected.to have_many(:security_qualifications).through(:company_security_qualifications) }
    it { is_expected.to have_many(:company_participate_qualifications).dependent(:destroy) }
    it { is_expected.to have_many(:participate_qualifications).through(:company_participate_qualifications) }

    it '会社作成時に機能上限のレコードが自動作成されること' do
      expect(company.company_functional_limitation).to be_present
    end
  end

  describe 'callbacks' do
    context 'after_create' do
      it 'create_limitationが呼ばれること' do
        company = build(:company)
        allow(company).to receive(:create_limitation)
        company.save!
        expect(company).to have_received(:create_limitation)
      end

      it 'テスト環境ではinitialize_bid_pipeline_statusesが呼ばれるが処理はスキップされること' do
        company = build(:company)
        allow(company).to receive(:initialize_bid_pipeline_statuses).and_call_original
        allow(company.bid_pipeline_statuses).to receive(:create!)
        company.save!
        expect(company.bid_pipeline_statuses).not_to have_received(:create!)
      end
    end
  end



  describe '#create_limitation' do
    it '会社の機能制限レコードを作成すること' do
      company = create(:company)
      expect(company.company_functional_limitation).to be_present
    end
  end

  describe '#has_feature?' do
    let(:company) { create(:company) }
    let(:feature) { create(:feature, key: Feature::KEYS[:proposal_document_create]) }

    context '会社に対象機能がある場合' do
      before { create(:company_feature, company:, feature:) }

      it 'returns true' do
        expect(company.has_feature?(Feature::KEYS[:proposal_document_create])).to be true
      end
    end

    context '会社に対象機能がない場合' do
      it 'returns false' do
        expect(company.has_feature?(Feature::KEYS[:proposal_document_create])).to be false
      end
    end
  end
end
