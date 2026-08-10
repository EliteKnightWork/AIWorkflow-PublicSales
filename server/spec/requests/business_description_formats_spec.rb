require 'rails_helper'

RSpec.describe 'BusinessDescriptionFormats' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  before { login_as(user) }

  describe 'POST /business_description_formats' do
    context 'パラメータが有効な場合' do
      it '201が返ること' do
        post '/v1/business_description_formats', params: { description: 'description' }
        assert_response_schema_confirm(201)
      end
    end

    context 'descriptionが空の場合' do
      it '400が返ること' do
        post '/v1/business_description_formats', params: { description: '' }
        assert_response_schema_confirm(400)
      end
    end
  end

  describe 'GET /business_description_formats' do
    context '事業情報が存在する場合' do
      it '200が返ること' do
        create(:business_description_format, company: company)
        get '/v1/business_description_formats'
        assert_response_schema_confirm(200)
      end
    end

    context '事業情報が存在しない場合' do
      it '200が返ること' do
        get '/v1/business_description_formats'
        assert_response_schema_confirm(200)
      end
    end
  end

  describe 'DELETE /business_description_formats/:id' do
    let(:business_description_format) { create(:business_description_format, company: company) }

    context 'パラメータが有効な場合' do
      it '200が返ること' do
        delete "/v1/business_description_formats/#{business_description_format.id}"
        assert_response_schema_confirm(200)
      end
    end

    context '事業情報が存在しない場合' do
      it '400が返ること' do
        delete '/v1/business_description_formats/0'
        assert_response_schema_confirm(400)
      end
    end
  end
end
