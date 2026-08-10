require 'rails_helper'

RSpec.describe 'AwardedProjects' do
  describe 'GET /v1/awarded_projects/:uuid/similar_projects' do
    let(:user) { create(:user) }
    let(:project) { create(:project, :with_awarded_project) }
    let(:similar_project) { create(:project) }
    let(:relation) { Project.where(id: similar_project.id) }
    let(:service_double) { instance_double(AwardedProjectSimilarProjectsFetcher, call: relation) }

    context 'ログインしている場合' do
      before do
        login_as(user)
        allow(AwardedProjectSimilarProjectsFetcher).to receive(:new).and_return(service_double)
      end

      context 'sizeパラメータが指定されていない場合' do
        it 'デフォルトで5件の似ている入札案件を取得できること' do
          get "/v1/awarded_projects/#{project.uuid}/similar_projects"

          expect(response).to have_http_status(:ok)
          assert_response_schema_confirm(200)
          expect(AwardedProjectSimilarProjectsFetcher).to have_received(:new).with(
            project: kind_of(Project),
            company_id: user.company_id,
            size: 5
          )
        end
      end

      context 'sizeパラメータが10の場合' do
        it '上位10件の似ている入札案件を取得できること' do
          get "/v1/awarded_projects/#{project.uuid}/similar_projects", params: { size: 10 }

          expect(response).to have_http_status(:ok)
          assert_response_schema_confirm(200)
          expect(AwardedProjectSimilarProjectsFetcher).to have_received(:new).with(
            project: kind_of(Project),
            company_id: user.company_id,
            size: 10
          )
        end
      end

      context 'sizeパラメータが100を超える場合' do
        it '最大100件に制限されること' do
          get "/v1/awarded_projects/#{project.uuid}/similar_projects", params: { size: 200 }

          expect(response).to have_http_status(:ok)
          expect(AwardedProjectSimilarProjectsFetcher).to have_received(:new).with(
            project: kind_of(Project),
            company_id: user.company_id,
            size: 100
          )
        end
      end

      context 'sizeパラメータが0以下の場合' do
        it '最小1件に制限されること' do
          get "/v1/awarded_projects/#{project.uuid}/similar_projects", params: { size: 0 }

          expect(response).to have_http_status(:ok)
          expect(AwardedProjectSimilarProjectsFetcher).to have_received(:new).with(
            project: kind_of(Project),
            company_id: user.company_id,
            size: 1
          )
        end

        it '負の値の場合も最小1件に制限されること' do
          get "/v1/awarded_projects/#{project.uuid}/similar_projects", params: { size: -10 }

          expect(response).to have_http_status(:ok)
          expect(AwardedProjectSimilarProjectsFetcher).to have_received(:new).with(
            project: kind_of(Project),
            company_id: user.company_id,
            size: 1
          )
        end
      end
    end

    context 'ログインしていない場合' do
      it '401が返ること' do
        get "/v1/awarded_projects/#{project.uuid}/similar_projects"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
