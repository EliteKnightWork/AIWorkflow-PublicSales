# == Schema Information
#
# Table name: bid_pipeline_statuses
# Database name: primary
#
#  id                            :bigint           not null, primary key
#  is_uneditable(編集不可フラグ) :boolean          default(FALSE), not null
#  name(ステータス名)            :string(255)      not null
#  order(表示順)                 :integer          default(0), not null
#  stage(ステージ(doing, done))  :string(255)      default("doing"), not null
#  created_at                    :datetime         not null
#  updated_at                    :datetime         not null
#  company_id(企業ID)            :bigint           not null
#
# Indexes
#
#  index_bid_pipeline_statuses_on_company_id                      (company_id)
#  index_bid_pipeline_statuses_on_company_id_and_name             (company_id,name) UNIQUE
#  index_bid_pipeline_statuses_on_company_id_and_stage_and_order  (company_id,stage,order) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require 'rails_helper'

RSpec.describe BidPipelineStatus, type: :model do
  describe 'validations' do
    subject { build(:bid_pipeline_status) }

    it { is_expected.to validate_presence_of(:company) }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:name).scoped_to(:company_id).case_insensitive }
    it { is_expected.to validate_presence_of(:stage) }
  end

  describe 'stage enum' do
    let(:status) { build(:bid_pipeline_status) }

    it '"doing"と"done"が設定できること' do
      status.stage = 'doing'
      expect(status).to be_valid
      expect(status.doing?).to be(true)

      status.stage = 'done'
      expect(status).to be_valid
      expect(status.done?).to be(true)
    end

    it '不正なstageではエラーになること' do
      expect { status.stage = 'invalid' }.to raise_error(ArgumentError)
    end
  end

  describe 'associations' do
    context 'with company' do
      let(:company) { create(:company) }

      it '編集不可のステータスは編集できないこと' do
        status = create(:bid_pipeline_status, company: company, is_uneditable: true)

        status.name = 'new name'
        status.save

        expect(status.errors[:is_uneditable]).to include('編集不可のステータスは編集できません')
      end

      it '編集不可のステータスは削除できないこと' do
        status = create(:bid_pipeline_status, company: company, is_uneditable: true)

        status.destroy

        expect(status.errors[:is_uneditable]).to include('編集不可のステータスは削除できません')
        expect(status.destroyed?).to be(false)
        expect(BidPipelineStatus.exists?(status.id)).to be(true)
      end

      it 'stageは変更できないこと' do
        status = create(:bid_pipeline_status, company: company, stage: 'doing')

        status.stage = 'done'
        status.save

        expect(status.errors[:stage]).to include('ステージは変更できません')
        expect(status.reload.stage).to eq('doing')
      end

      it '会社ごと削除された場合は編集不可のステータスも削除できること' do
        status = create(:bid_pipeline_status, company: company, is_uneditable: true)

        company.destroy

        expect(BidPipelineStatus.find_by(id: status.id)).to be_nil
        expect(Company.find_by(id: status.company_id)).to be_nil
      end

      it 'BidPipelineが紐づいている場合は削除できないこと' do
        status = create(:bid_pipeline_status, company: company)
        project = create(:project)
        create(:bid_pipeline, company: company, project: project, status: status)

        status.destroy

        expect(status).not_to be_destroyed
      end
    end
  end
end
