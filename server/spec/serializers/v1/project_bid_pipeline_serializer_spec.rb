require 'rails_helper'

RSpec.describe V1::ProjectBidPipelineSerializer do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:project) { create(:project) }
  let(:status) { create(:bid_pipeline_status, company: company) }
  let(:bid_pipeline) { create(:bid_pipeline, project: project, company: company, status: status) }
  
  before do
    create(:bid_pipeline_assignment, bid_pipeline: bid_pipeline, user: user)
  end

  describe '#serialization' do
    subject(:serialized_pipeline) { V1::ProjectBidPipelineSerializer.new(bid_pipeline).as_json }

    it 'includes id' do
      expect(serialized_pipeline[:id]).to eq(bid_pipeline.id)
    end

    it 'includes status' do
      expect(serialized_pipeline[:status]).to be_present
      expect(serialized_pipeline[:status][:id]).to eq(status.id)
    end

    it 'includes assigned_users' do
      expect(serialized_pipeline[:assigned_users]).to be_present
      expect(serialized_pipeline[:assigned_users].length).to eq(1)
      expect(serialized_pipeline[:assigned_users][0][:id]).to eq(user.id)
    end
  end
end
