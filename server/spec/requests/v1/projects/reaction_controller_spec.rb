require 'rails_helper'

RSpec.describe 'V1::Projects::Reaction', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company:) }
  let(:other_user) { create(:user, company:) }
  let(:project) { create(:project) }

  before do
    login_as(user)
  end

  describe 'PUT /v1/projects/:project_id/reaction' do
    let(:url) { "/v1/projects/#{project.uuid}/reaction" }

    context 'like リアクション' do
      it '新規作成できること' do
        put url, params: { reaction: 'like' }

        aggregate_failures do
          expect(response).to have_http_status(:ok)
          expect(response.parsed_body['reaction']).to eq('like')
        end
      end

      it '更新できること' do
        create(:project_reaction, user: user, project: project, reaction: 'dislike')

        put url, params: { reaction: 'like' }

        aggregate_failures do
          expect(response).to have_http_status(:ok)
          expect(response.parsed_body['reaction']).to eq('like')
        end
      end
    end

    context 'dislike リアクション' do
      it '新規作成できること' do
        put url, params: { reaction: 'dislike' }

        aggregate_failures do
          expect(response).to have_http_status(:ok)
          expect(response.parsed_body['reaction']).to eq('dislike')
        end
      end

      it '更新できること' do
        create(:project_reaction, user: user, project: project, reaction: 'like')

        put url, params: { reaction: 'dislike' }

        aggregate_failures do
          expect(response).to have_http_status(:ok)
          expect(response.parsed_body['reaction']).to eq('dislike')
        end
      end
    end

    context 'neutral リアクション' do
      it '新規作成できること' do
        put url, params: { reaction: 'neutral' }

        aggregate_failures do
          expect(response).to have_http_status(:ok)
          expect(response.parsed_body['reaction']).to eq('neutral')
        end
      end

      it '更新できること' do
        create(:project_reaction, user: user, project: project, reaction: 'like')

        put url, params: { reaction: 'neutral' }

        aggregate_failures do
          expect(response).to have_http_status(:ok)
          expect(response.parsed_body['reaction']).to eq('neutral')
        end
      end
    end

    context '無効なリアクション' do
      it '400エラーを返すこと' do
        put url, params: { reaction: 'invalid_reaction' }

        expect(response).to have_http_status(:bad_request)
      end
    end
  end
end
