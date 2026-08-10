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
class SourceFile < ApplicationRecord
  include FileNameValidatable

  belongs_to :attachable, polymorphic: true
  has_one_attached :file
end
