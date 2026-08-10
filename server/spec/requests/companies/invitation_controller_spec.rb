require 'rails_helper'

RSpec.describe 'Companies::InvitationController', type: :request do
  include ActiveSupport::Testing::TimeHelpers

  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  before { login_as(user) }

  describe 'GET /v1/companies/invitation' do
    context '会社に所属している場合' do
      it '招待トークンを生成できること' do
        get '/v1/companies/invitation'

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(response.parsed_body['token']).to be_present
        end
      end
    end

    context '会社に所属していない場合' do
      let(:user) { create(:user, company: nil) }

      it '403エラーが返ること' do
        get '/v1/companies/invitation'
        assert_response_schema_confirm(404)
      end
    end
  end

  describe 'GET /v1/companies/invitation/verify' do
    context '有効な招待トークンの場合' do
      let(:token) { company.generate_token_for(:invitation) }

      it 'trueが返ること' do
        get '/v1/companies/invitation/verify', params: { token: token }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['valid']).to be_truthy
      end
    end

    context '無効な招待トークンの場合' do
      it 'falseが返ること' do
        get '/v1/companies/invitation/verify', params: { token: 'invalid_token' }
        assert_response_schema_confirm(200)
        expect(response.parsed_body['valid']).to be_falsey
      end
    end
  end

  describe 'GET /v1/companies/invitation/check_limitation' do
    context '有効な招待トークンの場合' do
      let(:token) { company.generate_token_for(:invitation) }

      it 'can_joinがtrueで返ること' do
        get '/v1/companies/invitation/check_limitation', params: { token: token }

        aggregate_failures do
          assert_response_schema_confirm(200)
          expect(response.parsed_body['can_join']).to be_truthy
          expect(response.parsed_body['current_member_count']).to eq(company.users.count)
          expect(response.parsed_body['max_member_count']).to eq(CompanyFunctionalLimitation::DEFAULT_MAX_MEMBER_COUNT)
        end
      end

      context 'メンバー数が上限に達している場合' do
        before do
          company.company_functional_limitation.update!(max_member_count: 1)
        end

        it 'can_joinがfalseで返ること' do
          get '/v1/companies/invitation/check_limitation', params: { token: token }
          assert_response_schema_confirm(200)
          expect(response.parsed_body['can_join']).to be_falsey
          expect(response.parsed_body['current_member_count']).to eq(company.users.count)
          expect(response.parsed_body['max_member_count']).to eq(1)
        end
      end
    end

    context '無効な招待トークンの場合' do
      it '400エラーが返ること' do
        get '/v1/companies/invitation/check_limitation', params: { token: 'invalid_token' }
        assert_response_schema_confirm(400)
        expect(response.parsed_body['error']).to eq('invalid token')
      end
    end

    context '期限切れの招待トークンの場合' do
      let(:token) do
        travel_to(2.days.ago) do
          company.generate_token_for(:invitation)
        end
      end

      it '400エラーが返ること' do
        get '/v1/companies/invitation/check_limitation', params: { token: token }
        assert_response_schema_confirm(400)
        expect(response.parsed_body['error']).to eq('invalid token')
      end
    end
  end
end
