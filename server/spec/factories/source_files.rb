# == Schema Information
#
# Table name: source_files
# Database name: primary
#
#  id              :bigint           not null, primary key
#  attachable_type :string(255)
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  attachable_id   :bigint
#
# Indexes
#
#  index_source_files_on_attachable_type_and_attachable_id  (attachable_type,attachable_id)
#
FactoryBot.define do
  factory :source_file do
    file { Rack::Test::UploadedFile.new(Rails.root.join('spec/fixtures/dummy.pdf'), 'application/pdf') }
  end
end
