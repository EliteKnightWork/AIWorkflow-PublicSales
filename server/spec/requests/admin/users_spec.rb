require 'rails_helper'

RSpec.describe 'Admin::Users' do
  describe 'GET /v1/admin/users/search' do
    before do
      login_as(build(:user))
      create(:user, name: '山田太郎', email: 'yamada@example.com')
      create(:user, name: '山田花子', email: 'hanako@example.com')
      create(:user, name: '佐藤次郎', email: 'sato@example.com')
      create(:user, name: '鈴木三郎', email: 'suzuki@test.com')
    end

    it '検索条件なしで全件取得できること' do
      get '/v1/admin/users/search'

      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['users'].length).to eq(4)
      end
    end

    it '名前で検索できること' do
      get '/v1/admin/users/search', params: { name: '山田' }

      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['users'].length).to eq(2)
        names = json['users'].pluck('name')
        expect(names).to include('山田太郎', '山田花子')
      end
    end

    it 'メールアドレスで検索できること' do
      get '/v1/admin/users/search', params: { email: 'example.com' }

      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['users'].length).to eq(3)
        emails = json['users'].pluck('email')
        expect(emails).to include('yamada@example.com', 'hanako@example.com', 'sato@example.com')
      end
    end

    it '名前とメールアドレスの両方で検索できること' do
      get '/v1/admin/users/search', params: { name: '山田', email: 'yamada' }

      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['users'].length).to eq(1)
        expect(json['users'][0]['name']).to eq('山田太郎')
        expect(json['users'][0]['email']).to eq('yamada@example.com')
      end
    end

    it 'ページネーションが正しく機能すること' do
      get '/v1/admin/users/search', params: { page: 1, per_page: 2 }

      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['users'].length).to eq(2)
        expect(json['meta']['pagination']).to be_present
        expect(json['meta']['pagination']['count']).to eq(4)
        expect(json['meta']['pagination']['limit']).to eq(2)
        expect(json['meta']['pagination']['current']).to eq(1)
        expect(json['meta']['pagination']['pages']).to eq(2)
      end
    end
  end

  describe 'POST /v1/admin/users' do
    let(:company) { create(:company) }
    let(:valid_params) do
      {
        name: 'テストユーザー',
        email: 'test@example.com',
        password: 'password123',
        company_id: company.id
      }
    end

    before do
      login_as(build(:user))
    end

    context '正常なパラメーターの場合' do
      it 'Transactions::CreateAdminUserに委譲されること' do
        allow(Transactions::CreateAdminUser).to receive(:new).and_return(
          instance_double(Transactions::CreateAdminUser, exec: true, errors: [])
        )
        post '/v1/admin/users', params: valid_params
        assert_response_schema_confirm(201)
      end
    end

    context '組織が存在しない場合' do
      it '404エラーが返されること' do
        post '/v1/admin/users', params: valid_params.merge(company_id: 99999)
        assert_response_schema_confirm(404)
      end
    end
  end

  describe 'GET /v1/admin/users/:id' do
    before do
      login_as(build(:user))
    end

    context 'ユーザーが存在する場合' do
      it '200ステータスが返ること' do
        user = create(:user)
        get "/v1/admin/users/#{user.id}"

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['id']).to eq(user.id)
          expect(json['name']).to eq(user.name)
          expect(json['email']).to eq(user.email)
        end
      end
    end

    context 'ユーザーが存在しない場合' do
      it '404ステータスが返ること' do
        get '/v1/admin/users/0'
        assert_response_schema_confirm(404)
      end
    end
  end

  describe 'PATCH /v1/admin/users/:id' do
    before do
      login_as(build(:user))
    end

    context 'パラメーターが正常な場合' do
      it 'ユーザー情報が更新されること' do
        user = create(:user)

        patch "/v1/admin/users/#{user.id}", params: {
          name: '新しい名前',
          email: 'new_email@example.com',
          company_id: user.company_id
        }

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json['id']).to eq(user.id)
          expect(json['name']).to eq('新しい名前')
          expect(json['email']).to eq('new_email@example.com')
          expect(json['company']['id']).to eq(user.company_id)
        end
      end

      it 'company_idを変更しようとした場合、エラーが返されること' do
        user = create(:user, company: create(:company))
        secondary_company = create(:company)

        patch "/v1/admin/users/#{user.id}", params: {
          company_id: secondary_company.id
        }

        aggregate_failures do
          assert_response_schema_confirm(422)
        end
      end
    end

    context 'ユーザーが存在しない場合' do
      it '404ステータスが返ること' do
        patch '/v1/admin/users/0', params: { name: '新しい名前' }
        assert_response_schema_confirm(404)
      end
    end
  end

  describe 'DELETE /v1/admin/users/:id' do
    before do
      login_as(build(:user))
    end

    context 'ユーザーが存在する場合' do
      it '200ステータスが返ること' do
        user = create(:user)
        delete "/v1/admin/users/#{user.id}"

        aggregate_failures do
          assert_response_schema_confirm(200)
        end
      end
    end

    context 'ユーザーが存在しない場合' do
      it '404ステータスが返ること' do
        delete '/v1/admin/users/9999'
        assert_response_schema_confirm(404)
      end
    end
  end
end
