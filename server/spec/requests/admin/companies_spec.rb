require 'rails_helper'

RSpec.describe 'Admin::Companies' do
  before do
    login_as(build(:user))
  end

  describe 'GET /v1/admin/companies' do
    it '200ステータスが返ること' do
      create(:company)
      get '/v1/admin/companies'
      assert_response_schema_confirm(200)
    end

    it 'ページネーションが正しく機能すること' do
      create_list(:company, 3)
      get '/v1/admin/companies', params: { page: 1 }

      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['companies']).to be_present
        expect(json['meta']['pagination']).to be_present
      end
    end

    it '全件取得ができること' do
      create_list(:company, 3)
      get '/v1/admin/companies', params: { all: true }

      aggregate_failures do
        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json['companies']).to be_present
        expect(json['meta']).to be_nil
      end
    end
  end

  describe 'POST /v1/admin/companies' do
    context 'パラメーターが正常な場合' do
      it 'success' do
        company_params = attributes_for(:company)
        expect {
          post '/v1/admin/companies', params: company_params
        }.to change(Company, :count).by(1)
        assert_response_schema_confirm(201)
      end

    end

    context 'nameがnilの場合' do
      it '422エラーが返ること' do
        company_params = attributes_for(:company, name: nil)
        expect {
          post '/v1/admin/companies', params: company_params
        }.to not_change(Company, :count)
        assert_response_schema_confirm(422)
      end
    end

    context 'nameが空文字の場合' do
      it '422エラーが返ること' do
        company_params = attributes_for(:company, name: '')
        expect {
          post '/v1/admin/companies', params: company_params
        }.to not_change(Company, :count)
        assert_response_schema_confirm(422)
      end
    end
  end

  describe 'PATCH /v1/admin/companies/:id' do
    let(:company) { create(:company, is_trial: false) }

    context 'パラメーターが正常な場合' do
      it 'is_trialを更新できること' do
        patch "/v1/admin/companies/#{company.id}", params: { is_trial: true }
        
        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(company.reload.is_trial).to be(true)
          json = response.parsed_body
          expect(json['isTrial']).to be(true)
        end
      end

      it '企業名を更新できること' do
        new_name = 'Updated Company Name'
        patch "/v1/admin/companies/#{company.id}", params: { name: new_name }
        
        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(company.reload.name).to eq(new_name)
          json = response.parsed_body
          expect(json['name']).to eq(new_name)
        end
      end

      it 'company_featuresを更新できること' do
        feature_a = create(:feature, key: Feature::KEYS[:ai_chat])
        feature_b = create(:feature, key: Feature::KEYS[:proposal_document_create])
        company.features = [feature_a]

        patch "/v1/admin/companies/#{company.id}", params: { company_feature_keys: [feature_b.key] }

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(company.reload.features.pluck(:key)).to contain_exactly(feature_b.key)
          json = response.parsed_body
          expect(json['features']).to contain_exactly(
            a_hash_including(
              'id' => feature_b.id,
              'key' => feature_b.key,
              'description' => feature_b.description
            )
          )
        end
      end
    end

    context 'パラメーターが不正な場合' do
      it 'nameが空の場合は422エラーが返ること' do
        patch "/v1/admin/companies/#{company.id}", params: { name: '' }
        
        aggregate_failures do
          assert_response_schema_confirm(422)
          expect(company.reload.name).not_to eq('')
        end
      end
    end

    context '存在しないIDの場合' do
      it '404エラーが返ること' do
        patch '/v1/admin/companies/999999', params: { is_trial: true }
        assert_response_schema_confirm(404)
      end
    end
  end

  describe 'DELETE /v1/admin/companies/:id' do
    let(:company) { create(:company) }

    context '企業が存在する場合' do
      it '企業が削除されること' do
        delete "/v1/admin/companies/#{company.id}"
        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(Company.exists?(company.id)).to be(false)
        end
      end

      it '関連するユーザーが存在する場合、削除できないこと' do
        create(:user, company: company)
        
        delete "/v1/admin/companies/#{company.id}"
        aggregate_failures do
          assert_response_schema_confirm(422)
          json = response.parsed_body
          expect(json['has_users']).to be(true)
          expect(Company.exists?(company.id)).to be(true)
        end
      end
    end

    context '企業が存在しない場合' do
      it '404エラーが返ること' do
        delete '/v1/admin/companies/9999'
        assert_response_schema_confirm(404)
      end
    end
  end
end
