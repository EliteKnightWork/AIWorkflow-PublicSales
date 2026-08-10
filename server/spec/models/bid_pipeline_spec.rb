# == Schema Information
#
# Table name: bid_pipelines
# Database name: primary
#
#  id                                   :bigint           not null, primary key
#  created_at                           :datetime         not null
#  updated_at                           :datetime         not null
#  bid_pipeline_status_id(ステータスID) :bigint           not null
#  company_id(企業ID)                   :bigint           not null
#  project_id(案件ID)                   :bigint           not null
#
# Indexes
#
#  index_bid_pipelines_on_bid_pipeline_status_id     (bid_pipeline_status_id)
#  index_bid_pipelines_on_company_id                 (company_id)
#  index_bid_pipelines_on_company_id_and_project_id  (company_id,project_id) UNIQUE
#  index_bid_pipelines_on_project_id                 (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (bid_pipeline_status_id => bid_pipeline_statuses.id)
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (project_id => projects.id)
#
require 'rails_helper'

RSpec.describe BidPipeline, type: :model do
  describe 'associations' do
    it { is_expected.to have_many(:custom_objects).dependent(:destroy) }

    it '一番過去のタスクを取得できること' do
      bid_pipeline = create(:bid_pipeline)
      # 既存データとの重複を避けるため、nameは指定せず factory に任せ、company を揃える
      pending = create(:bid_pipeline_task_status, company: bid_pipeline.company, stage: 'todo')
      in_progress = create(:bid_pipeline_task_status, company: bid_pipeline.company, stage: 'doing')
      completed = create(:bid_pipeline_task_status, company: bid_pipeline.company, stage: 'done')

      create(:bid_pipeline_task, bid_pipeline: bid_pipeline, due_date: 1.day.since, status: completed)
      create(:bid_pipeline_task, bid_pipeline: bid_pipeline, due_date: 2.days.since, status: in_progress)
      create(:bid_pipeline_task, bid_pipeline: bid_pipeline, due_date: 3.days.since, status: pending)

      expect(bid_pipeline.upcomming_task.due_date).to eq(2.days.since.to_date)
    end
  end

  describe 'callbacks' do
    describe 'after_create' do
      context 'カスタムオブジェクトテンプレートがある場合' do
        let(:company) { create(:company) }
        let(:project) { create(:project) }
        let(:status) { create(:bid_pipeline_status, company: company) }
        let(:template_num) { Faker::Number.between(from: 1, to: 5) }

        before { create_list(:custom_object_template, template_num, company: company) }


        it '会社に紐づくカスタムオブジェクトテンプレートの数だけカスタムオブジェクトが作成されること' do

          bid_pipeline = BidPipeline.create!(
            company: company,
            project: project,
            status: status
          )

          expect(bid_pipeline.custom_objects.count).to eq(template_num)
          expect(bid_pipeline.custom_objects.map(&:custom_object_template)).to match_array(company.custom_object_templates)
        end
      end

      context 'カスタムオブジェクトテンプレートがない場合' do
        let(:company) { create(:company) }
        let(:project) { create(:project) }
        let(:status) { create(:bid_pipeline_status, company: company) }

        it 'カスタムオブジェクトテンプレートがない場合はカスタムオブジェクトが作成されないこと' do
          bid_pipeline = BidPipeline.create!(
            company: company,
            project: project,
            status: status
          )
  
          expect(bid_pipeline.custom_objects.count).to eq(0)
        end
      end
    end
  end

  describe '.build_with_params / #update_with_params の会社一致検証' do
    let(:company) { create(:company) }
    let(:other_company) { create(:company) }
    let(:project) { create(:project) }
    let(:status) { create(:bid_pipeline_status, company: company) }
    let(:pipeline) { create(:bid_pipeline, company: company, project: project, status: status) }
    let(:user_with_company) { create(:user, company: company) }
    let(:user_with_other_company) { create(:user, company: other_company) }

    it 'build_with_params: 異なる会社のユーザーIDは割当されない' do
      built = described_class.build_with_params(
        company: company,
        create_params: {
          project_uuid: project.uuid,
          bid_pipeline_status_id: status.id,
          assigned_user_ids: [user_with_company.id, user_with_other_company.id]
        }
      )

      built.save

      # 同一企業ユーザーのみが割当されていること
      expect(built.assigned_users.pluck(:id)).to contain_exactly(user_with_company.id)
    end

    it 'update_with_params: 異なる会社のユーザーIDは割当されない' do

      pipeline.update_with_params( assigned_user_ids: [user_with_company.id, user_with_other_company.id])

      # 同一企業ユーザーのみが割当されていること
      expect(pipeline.assigned_users.pluck(:id)).to contain_exactly(user_with_company.id)
    end
  end
end
