require 'rails_helper'

RSpec.describe 'V1::Companies::CustomObjectFilterItems', type: :request do
  let(:company) { create(:company) }
  let!(:user) { create(:user, company: company) }
  let!(:other_user) { create(:user, company: create(:company)) }
  let!(:custom_object_template) { create(:custom_object_template, company: company) }
  let!(:custom_object_template_item) do
    create(:custom_object_template_item, 
           custom_object_template: custom_object_template,
           title: 'テスト項目',
           input_type: 'checkbox')
  end
  let!(:choice_one) do
    create(:custom_object_template_item_value,
           custom_object_template_item: custom_object_template_item,
           choice_content: '選択肢1')
  end
  let!(:choice_two) do
    create(:custom_object_template_item_value,
           custom_object_template_item: custom_object_template_item,
           choice_content: '選択肢2')
  end

  describe 'GET /v1/companies/:company_id/custom_object_filter_items' do
    context '存在するカンパニーの場合' do
      before { login_as(user) }

      it 'カンパニーに属するフィルター項目一覧を取得できる' do
        get "/v1/companies/#{company.id}/custom_object_filter_items"

        assert_response_schema_confirm(200)
        item = response.parsed_body.first
        expect(item['id']).to eq(custom_object_template_item.id)
        expect(item['title']).to eq('テスト項目')
        expect(item['inputType']).to eq('checkbox')
        expect(item['customObjectTemplate']).to include(
          'id' => custom_object_template.id,
          'title' => custom_object_template.title
        )
      end

      it 'レスポンスの選択肢に正しい内容が含まれている' do
        get "/v1/companies/#{company.id}/custom_object_filter_items"

        assert_response_schema_confirm(200)
        item = response.parsed_body.first
        expect(item['choices'][0]['id']).to eq(choice_one.id)
        expect(item['choices'][0]['content']).to eq('選択肢1')
        expect(item['choices'][1]['id']).to eq(choice_two.id)
        expect(item['choices'][1]['content']).to eq('選択肢2')
      end
    end

    context '存在しないカンパニーの場合' do
      before { login_as(user) }

      it '404エラーを返す' do
        get "/v1/companies/#{Company.last.id + 1}/custom_object_filter_items"

        assert_response_schema_confirm(404)
      end
    end

    context '他のカンパニーのフィルター項目にアクセスしようとした場合' do
      before { login_as(other_user) }

      it '403エラーを返す' do
        get "/v1/companies/#{company.id}/custom_object_filter_items"

        assert_response_schema_confirm(403)
      end
    end
  end
end
