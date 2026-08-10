# == Schema Information
#
# Table name: external_documents
# Database name: primary
#
#  id                                         :bigint           not null, primary key
#  attachable_type                            :string(255)
#  is_processed(テキスト抽出処理実行済フラグ) :boolean          default(FALSE), not null
#  text(ファイル内テキスト)                   :text(4294967295)
#  created_at                                 :datetime
#  updated_at                                 :datetime
#  attachable_id                              :bigint
#
# Indexes
#
#  index_external_documents_on_attachable_type_and_attachable_id  (attachable_type,attachable_id)
#
FactoryBot.define do
  factory :external_document do
    text { Faker::Lorem.paragraph }
    is_processed { false }
    file { Rack::Test::UploadedFile.new(Rails.root.join('spec/fixtures/dummy.pdf'), 'application/pdf') }
  end
end
