# == Schema Information
#
# Table name: awarded_project_screenshots
#
#  id                             :bigint           not null, primary key
#  source_url(掲載元のURL)        :string(255)      not null
#  created_at                     :datetime         not null
#  updated_at                     :datetime         not null
#  awarded_project_id(落札情報ID) :bigint           not null
#
# Indexes
#
#  index_awarded_project_screenshots_on_awarded_project_id  (awarded_project_id)
#
# Foreign Keys
#
#  fk_rails_...  (awarded_project_id => awarded_projects.id)
#
class AwardedProjectScreenshot < ApplicationRecord
end
