require 'rails_helper'

RSpec.describe 'V1::BidPipelines::CustomObjects' do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  before { login_as(user) }

  describe 'GET /v1/bid_pipelines/:bid_pipeline_id/custom_objects' do
    let(:custom_object_template) { create(:custom_object_template, company: company) }
    let(:bid_pipeline) { create(:bid_pipeline, company: company) }

    context '通常系' do
      # BidPipeline.after_create creates a CustomObject for each template.
      # Use the auto-created record to avoid duplicates.
      let(:custom_object) { bid_pipeline.custom_objects.find_by!(custom_object_template: custom_object_template) }
      let!(:custom_object_items) { create(:custom_object_item, custom_object: custom_object) }

      it 'custom_objectsが取得できること' do
        get "/v1/bid_pipelines/#{bid_pipeline.id}/custom_objects"

        assert_response_schema_confirm(200)
        json = response.parsed_body
        expect(json.length).to eq(1)
        expect(json[0]['id']).to eq(custom_object.id)
        expect(json[0]['title']).to eq(custom_object_template.title)
        expect(json[0]['customObjectItems'].length).to eq(1)
      end

      it 'custom_object_itemsの詳細情報が取得できること' do
        get "/v1/bid_pipelines/#{bid_pipeline.id}/custom_objects"

        assert_response_schema_confirm(200)
        json = response.parsed_body
        items = json[0]['customObjectItems']
        expect(items[0]).to include(
          "id" => custom_object_items.id,
          "isChecked" => custom_object_items.is_checked,
          "userId" => custom_object_items.user_id,
          "freeText" => custom_object_items.free_text,
          "calendar" => custom_object_items.calendar.as_json,
          "url" => custom_object_items.url,
          "title" => custom_object_items.custom_object_template_item_value&.custom_object_template_item&.title,
          "inputType" => custom_object_items.custom_object_template_item_value&.custom_object_template_item&.input_type,
          "checkboxTitle" => custom_object_items.custom_object_template_item_value&.choice_content,
          "radioButtonTitle" => custom_object_items.custom_object_template_item_value&.choice_content,
        )
      end
    end

    context 'custom_objectが存在しない場合' do
      it '空配列が返ること' do
        empty_bid_pipeline = create(:bid_pipeline, company: company)

        get "/v1/bid_pipelines/#{empty_bid_pipeline.id}/custom_objects"

        aggregate_failures do
          assert_response_schema_confirm(200)
          json = response.parsed_body
          expect(json.length).to eq(0)
        end
      end
    end
  end
end
