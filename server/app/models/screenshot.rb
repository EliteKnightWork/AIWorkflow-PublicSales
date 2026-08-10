# == Schema Information
#
# Table name: screenshots
# Database name: primary
#
#  id                      :bigint           not null, primary key
#  attachable_type         :string(255)
#  source_url(掲載元のURL) :text(65535)      not null
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  attachable_id           :bigint
#
# Indexes
#
#  index_screenshots_on_attachable_type_and_attachable_id  (attachable_type,attachable_id)
#
class Screenshot < ApplicationRecord
  include FileNameValidatable

  belongs_to :attachable, polymorphic: true
  has_one_attached :file

  validates :source_url, presence: true
end
