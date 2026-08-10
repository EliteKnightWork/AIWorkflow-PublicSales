require 'rails_helper'

RSpec.describe 'V1::ReactedProjects', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company:) }
  let(:other_user) { create(:user, company:) }
  let(:project) { create(:project) }

  before do
    login_as(user)
  end

  describe 'GET /v1/reacted_projects' do
    context '組織に所属している場合' do
      context 'reaction=likeの場合' do
        it '200が返り、likeしたプロジェクトのみが返ること' do
          create_list(:project_reaction, 3, user:, reaction: :like)
          create_list(:project_reaction, 2, user: other_user, reaction: :like)
          # dislikeやneutralは含まれないことを確認
          create_list(:project_reaction, 2, user:, reaction: :dislike)
          create_list(:project_reaction, 1, user: other_user, reaction: :neutral)

          get '/v1/reacted_projects', params: { reaction: 'like' }

          aggregate_failures do
            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            expect(json['reactedProjects'].length).to eq(5)
            expect(json['reactedProjects']).to all(include('reactedByList', 'uuid'))
          end
        end

        it 'reacted_by_listが含まれること' do
          project = create(:project)
          create(:project_reaction, user:, project:, reaction: :like)
          create(:project_reaction, user: other_user, project:, reaction: :like)

          get '/v1/reacted_projects', params: { reaction: 'like' }

          aggregate_failures do
            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            project = json['reactedProjects'].first
            expect(project).to have_key('reactedByList')
            expect(project['reactedByList'].length).to eq(2)
            expect(project).to have_key('uuid')
          end
        end
      end

      context 'reaction=dislikeの場合' do
        it '200が返り、dislikeしたプロジェクトのみが返ること' do
          create_list(:project_reaction, 2, user:, reaction: :dislike)
          create_list(:project_reaction, 1, user: other_user, reaction: :dislike)
          # likeやneutralは含まれないことを確認
          create_list(:project_reaction, 3, user:, reaction: :like)
          create_list(:project_reaction, 1, user: other_user, reaction: :neutral)

          get '/v1/reacted_projects', params: { reaction: 'dislike' }

          aggregate_failures do
            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            expect(json['reactedProjects'].length).to eq(3)
          end
        end
      end

      context 'reaction=neutralの場合' do
        it '200が返り、neutralなプロジェクトのみが返ること' do
          create_list(:project_reaction, 2, user:, reaction: :neutral)
          create_list(:project_reaction, 1, user: other_user, reaction: :neutral)
          # likeやdislikeは含まれないことを確認
          create_list(:project_reaction, 3, user:, reaction: :like)
          create_list(:project_reaction, 1, user: other_user, reaction: :dislike)

          get '/v1/reacted_projects', params: { reaction: 'neutral' }

          aggregate_failures do
            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            expect(json['reactedProjects'].length).to eq(3)
          end
        end
      end

      it '非表示のプロジェクトは含まれないこと' do
        visible_project = create(:project, hidden_at: nil)
        hidden_project = create(:project, hidden_at: Time.zone.now)
        create(:project_reaction, user:, project: visible_project, reaction: :like)
        create(:project_reaction, user:, project: hidden_project, reaction: :like)

        get '/v1/reacted_projects', params: { reaction: 'like' }

          aggregate_failures do
            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            project_ids = json['reactedProjects'].pluck('uuid')
            expect(project_ids).to include(visible_project.uuid)
            expect(project_ids).not_to include(hidden_project.uuid)
          end
      end

      it '他社のプロジェクトは含まれないこと' do
        other_company = create(:company)
        other_company_project = create(:company_project, company: other_company)
        other_project = create(:project, company_project: other_company_project)
        public_project = create(:project, company_project: nil)
        create(:project_reaction, user:, project: other_project, reaction: :like)
        create(:project_reaction, user:, project: public_project, reaction: :like)

        get '/v1/reacted_projects', params: { reaction: 'like' }

          aggregate_failures do
            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            project_ids = json['reactedProjects'].pluck('uuid')
            expect(project_ids).to include(public_project.uuid)
            expect(project_ids).not_to include(other_project.uuid)
          end
      end

      context 'ユーザーIDを指定した場合' do
        it '指定したユーザーがリアクションしている案件のみが返ること' do
          create_list(:project_reaction, 3, user:, reaction: :like)
          create_list(:project_reaction, 2, user: other_user, reaction: :like)

          get '/v1/reacted_projects', params: { reaction: 'like', user_ids: [other_user.id] }

          aggregate_failures do
            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            expect(json['reactedProjects'].length).to eq(2)
          end
        end
      end

      context '同じプロジェクトに複数のユーザーがリアクションしている場合' do
        it '重複が排除されること' do
          shared_project = create(:project)
          create(:project_reaction, user:, project: shared_project, reaction: :like)
          create(:project_reaction, user: other_user, project: shared_project, reaction: :like)
          create_list(:project_reaction, 2, user:, reaction: :like)

          get '/v1/reacted_projects', params: { reaction: 'like' }

          aggregate_failures do
            expect(response).to have_http_status(:ok)
            json = response.parsed_body
            # 同じプロジェクトは1つとしてカウントされる
            expect(json['reactedProjects'].length).to eq(3)
          end
        end
      end
    end

    context '組織に所属していない場合' do
      let(:user_without_company) { create(:user, company: nil) }

      before do
        login_as(user_without_company)
      end

      it '403が返ること' do
        get '/v1/reacted_projects', params: { reaction: 'like' }

        expect(response).to have_http_status(:forbidden)
        json = response.parsed_body
        expect(json['errors']).to include('forbidden')
      end
    end

    context 'reactionパラメータが無効な場合' do
      it '400エラーを返すこと' do
        get '/v1/reacted_projects', params: { reaction: 'invalid_reaction' }

        expect(response).to have_http_status(:bad_request)
        json = response.parsed_body
        expect(json['error']).to include('無効なリアクションです')
      end
    end

    context 'reactionパラメータが指定されていない場合' do
      it '400エラーを返すこと' do
        get '/v1/reacted_projects'

        expect(response).to have_http_status(:bad_request)
        json = response.parsed_body
        expect(json['error']).to include('無効なリアクションです')
      end
    end
  end
end
