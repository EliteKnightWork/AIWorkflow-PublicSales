# == Schema Information
#
# Table name: bid_pipeline_task_attachments
# Database name: primary
#
#  id                                             :bigint           not null, primary key
#  created_at                                     :datetime         not null
#  updated_at                                     :datetime         not null
#  bid_pipeline_task_id(入札パイプラインタスクID) :bigint           not null
#
# Indexes
#
#  index_bid_pipeline_task_attachments_on_bid_pipeline_task_id  (bid_pipeline_task_id)
#
# Foreign Keys
#
#  fk_rails_...  (bid_pipeline_task_id => bid_pipeline_tasks.id)
#
FactoryBot.define do
  factory :bid_pipeline_task_attachment do
    bid_pipeline_task

    after(:build) do |attachment|
      attachment.file.attach(
        io: Rails.root.join("spec/fixtures/dummy.pdf").open,
        filename: 'dummy.pdf',
        content_type: 'application/pdf'
      )
    end
  end
end
