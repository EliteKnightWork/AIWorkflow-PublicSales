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
require 'rails_helper'

RSpec.describe Screenshot do
  pending "add some examples to (or delete) #{__FILE__}"
end
