require 'rails_helper'

RSpec.describe 'Projects::SimilarAwardedProjects' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:project) { create(:project) }
  let(:lg_code) { create(:project_lg_code, project: project) }

  before do
    # Projectの作成時のコールバック（埋め込み生成）を無効化
    allow_any_instance_of(Project).to receive(:check_and_build_project_embeddings)
    project.lg_codes << lg_code
  end

  describe 'GET /v1/projects/:id/similar_awarded_projects' do
    context 'ログインしている場合' do
      before { login_as(user) }

      context 'sizeパラメータが指定されていない場合' do
        let(:similar_projects) { create_list(:project, 5) }
        let(:base_relation) { Project.none }
        let(:search_relation) { Project.where(id: similar_projects.map(&:id)) }
        let(:search_result) { instance_double(Elasticsearch::Model::Response::Response, records: search_relation) }

        before do
          allow(Project).to receive(:for_company).with(company.id).and_return(base_relation)
          allow(base_relation).to receive_messages(similar_awarded_projects_search: search_result, find_by!: project, includes: base_relation, where: base_relation, in_order_of: search_relation)
        end

        it 'デフォルトで20件の似ている落札案件を取得できること' do
          get "/v1/projects/#{project.uuid}/similar_awarded_projects"

          expect(response).to have_http_status(:ok)
          assert_response_schema_confirm(200)
          expect(base_relation).to have_received(:similar_awarded_projects_search).with(
            project.title,
            [lg_code.code],
            size: 20
          )
        end
      end

      context 'sizeパラメータが5の場合' do
        let(:similar_projects) { create_list(:project, 5) }
        let(:base_relation) { Project.none }
        let(:search_relation) { Project.where(id: similar_projects.map(&:id)) }
        let(:search_result) { instance_double(Elasticsearch::Model::Response::Response, records: search_relation) }

        before do
          allow(Project).to receive(:for_company).with(company.id).and_return(base_relation)
          allow(base_relation).to receive_messages(similar_awarded_projects_search: search_result, find_by!: project, includes: base_relation, where: base_relation, in_order_of: search_relation)
        end

        it '上位5件の似ている落札案件を取得できること' do
          get "/v1/projects/#{project.uuid}/similar_awarded_projects", params: { size: 5 }

          expect(response).to have_http_status(:ok)
          assert_response_schema_confirm(200)
          expect(base_relation).to have_received(:similar_awarded_projects_search).with(
            project.title,
            [lg_code.code],
            size: 5
          )
        end
      end

      context 'sizeパラメータが100を超える場合' do
        let(:similar_projects) { create_list(:project, 5) }
        let(:base_relation) { Project.none }
        let(:search_relation) { Project.where(id: similar_projects.map(&:id)) }
        let(:search_result) { instance_double(Elasticsearch::Model::Response::Response, records: search_relation) }

        before do
          allow(Project).to receive(:for_company).with(company.id).and_return(base_relation)
          allow(base_relation).to receive_messages(similar_awarded_projects_search: search_result, find_by!: project, includes: base_relation, where: base_relation, in_order_of: search_relation)
        end

        it '最大100件に制限されること' do
          get "/v1/projects/#{project.uuid}/similar_awarded_projects", params: { size: 200 }

          expect(response).to have_http_status(:ok)
          expect(base_relation).to have_received(:similar_awarded_projects_search).with(
            project.title,
            [lg_code.code],
            size: 100
          )
        end
      end

      context 'sizeパラメータが0以下の場合' do
        let(:similar_projects) { create_list(:project, 1) }
        let(:base_relation) { Project.none }
        let(:search_relation) { Project.where(id: similar_projects.map(&:id)) }
        let(:search_result) { instance_double(Elasticsearch::Model::Response::Response, records: search_relation) }

        before do
          allow(Project).to receive(:for_company).with(company.id).and_return(base_relation)
          allow(base_relation).to receive_messages(similar_awarded_projects_search: search_result, find_by!: project, includes: base_relation, where: base_relation, in_order_of: search_relation)
        end

        it '最小1件に制限されること' do
          get "/v1/projects/#{project.uuid}/similar_awarded_projects", params: { size: 0 }

          expect(response).to have_http_status(:ok)
          expect(base_relation).to have_received(:similar_awarded_projects_search).with(
            project.title,
            [lg_code.code],
            size: 1
          )
        end

        it '負の値の場合も最小1件に制限されること' do
          get "/v1/projects/#{project.uuid}/similar_awarded_projects", params: { size: -10 }

          expect(response).to have_http_status(:ok)
          expect(base_relation).to have_received(:similar_awarded_projects_search).with(
            project.title,
            [lg_code.code],
            size: 1
          )
        end
      end

      context 'プロジェクトが存在しない場合' do
        it '404が返ること' do
          get "/v1/projects/non-existent-uuid/similar_awarded_projects"

          expect(response).to have_http_status(:not_found)
        end
      end

      context 'company_projectに紐づくプロジェクトの場合' do
        let(:company_project) { create(:company_project, company: company) }
        let(:project) { create(:project, company_project: company_project) }
        let(:lg_code) { create(:project_lg_code, project: project) }
        let(:similar_projects) { create_list(:project, 5) }
        let(:base_relation) { Project.none }
        let(:search_relation) { Project.where(id: similar_projects.map(&:id)) }
        let(:search_result) { instance_double(Elasticsearch::Model::Response::Response, records: search_relation) }

        before do
          allow(Project).to receive(:for_company).with(company.id).and_return(base_relation)
          allow(base_relation).to receive_messages(similar_awarded_projects_search: search_result, find_by!: project, includes: base_relation, where: base_relation, in_order_of: search_relation)
        end

        it 'デフォルトで20件の似ている落札案件を取得できること' do
          get "/v1/projects/#{project.uuid}/similar_awarded_projects"

          expect(response).to have_http_status(:ok)
          assert_response_schema_confirm(200)
          expect(base_relation).to have_received(:similar_awarded_projects_search).with(
            project.title,
            [lg_code.code],
            size: 20
          )
        end
      end
    end

    context 'ログインしていない場合' do
      it '401が返ること' do
        get "/v1/projects/#{project.uuid}/similar_awarded_projects"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end

