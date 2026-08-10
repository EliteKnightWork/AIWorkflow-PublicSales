# == Schema Information
#
# Table name: bid_pipeline_task_statuses
# Database name: primary
#
#  id                                 :bigint           not null, primary key
#  is_default(デフォルトフラグ)       :boolean          default(FALSE), not null
#  name(ステータス名)                 :string(255)      not null
#  order(表示順)                      :integer          default(0), not null
#  stage(ステージ(todo, doing, done)) :string(255)      default("todo"), not null
#  created_at                         :datetime         not null
#  updated_at                         :datetime         not null
#  company_id(企業ID)                 :bigint           not null
#
# Indexes
#
#  index_bid_pipeline_task_statuses_on_company_id            (company_id)
#  index_bid_pipeline_task_statuses_on_company_id_and_name   (company_id,name) UNIQUE
#  index_bid_pipeline_task_statuses_on_company_id_and_order  (company_id,order) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require 'rails_helper'

RSpec.describe BidPipelineTaskStatus, type: :model do
  describe 'validations' do
    subject { build(:bid_pipeline_task_status) }

    it { is_expected.to validate_presence_of(:company) }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_uniqueness_of(:name).scoped_to(:company_id).case_insensitive }
  end

  describe 'associations' do
    context 'with company' do
      let(:company) { create(:company) }

      it '最初に作成されるステータスはデフォルトフラグがtrueであること' do
        status = create(:bid_pipeline_task_status, company: company)

        expect(status.is_default).to be(true)
      end

      it '2個目以降のステータスはデフォルトフラグがfalseであること' do
        create(:bid_pipeline_task_status, company: company)
        status = create(:bid_pipeline_task_status, company: company)

        expect(status.is_default).to be(false)
      end

      it 'デフォルトフラグがtrueのステータスが更新された場合、他のステータスのデフォルトフラグはfalseになること' do
        status1 = create(:bid_pipeline_task_status, company: company)
        status2 = create(:bid_pipeline_task_status, company: company)

        status2.update(is_default: true)

        expect(status2.reload.is_default).to be(true)
        expect(status1.reload.is_default).to be(false)
      end
    end
  end
end
