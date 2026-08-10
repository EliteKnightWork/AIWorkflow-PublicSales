require 'rails_helper'

RSpec.describe 'Favorites' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company:) }
  let(:other_user) { create(:user, company:) }

  before { login_as(user) }

  describe 'GET /favorites' do
    context 'パラメータが有効な場合' do
      it '200が返ること' do
        create_list(:favorite, 3, user:)
        create_list(:favorite, 2, user: other_user)
        get '/v1/favorites'

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['favorites'].length).to eq(5)
        end
      end
    end

    context 'ユーザーIDを指定した場合' do
      it '指定したユーザーがお気に入りしている案件のみが返ること' do
        create_list(:favorite, 3, user:)
        create_list(:favorite, 2, user: other_user)
        get '/v1/favorites', params: { user_ids: [other_user.id] }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['favorites'].length).to eq(2)
        end
      end
    end
  end

  describe 'POST /favorites' do
    context 'パラメーターが有効な場合' do
      it '201が返ること' do
        project = create(:project)
        post '/v1/favorites', params: { uuid: project.uuid }
        assert_response_schema_confirm(201)
      end
    end

    context '指定されたproject_idが存在しないとき' do
      it '500が返ること' do
        post '/v1/favorites', params: { project_id: 'hoge' }
        assert_response_schema_confirm(500)
      end
    end

    context '同じ組織のユーザーがお気に入り登録しているとき' do
      it 'favoritesのレコードが増える' do
        project = create(:project)
        create(:favorite, user: other_user, project: project)
        post '/v1/favorites', params: { uuid: project.uuid }
        assert_response_schema_confirm(201)
        expect(Favorite.count).to eq(2)
      end
    end
  end

  describe 'DELETE /favorites/:uuid' do
    context 'パラメーターが有効な場合' do
      it '200が返ること' do
        favorite = create(:favorite, user: user)
        expect {
          delete "/v1/favorites/#{favorite.project.uuid}"
        }.to change(Favorite, :count).by(-1)
        assert_response_schema_confirm(200)
      end
    end

    context '同じ組織のユーザーが登録したお気に入りを削除しようとしたとき' do
      it '404が返ること' do
        favorite = create(:favorite, user: other_user)
        expect {
          delete "/v1/favorites/#{favorite.project.uuid}"
        }.not_to change(Favorite, :count)
        assert_response_schema_confirm(404)
      end
    end

    context '指定されたidが存在しないとき' do
      it '404が返ること' do
        delete '/v1/favorites/hoge'
        assert_response_schema_confirm(404)
      end
    end
  end
end
