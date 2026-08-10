require 'rails_helper'

RSpec.describe 'Healths' do
  describe 'GET /health' do
    it 'success' do
      get '/v1/health'
      assert_response_schema_confirm(200)
    end
  end
end
