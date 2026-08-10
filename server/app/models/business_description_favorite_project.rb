# == Schema Information
#
# Table name: business_description_favorite_projects
# Database name: primary
#
#  id                                  :bigint           not null, primary key
#  created_at                          :datetime         not null
#  updated_at                          :datetime         not null
#  project_id(案件ID)                  :bigint           not null
#  search_filter_preset_id(検索条件ID) :bigint           not null
#
# Indexes
#
#  idx_on_search_filter_preset_id_3613adedc3                   (search_filter_preset_id)
#  index_business_description_favorite_projects_on_project_id  (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (search_filter_preset_id => search_filter_presets.id)
#
class BusinessDescriptionFavoriteProject < ApplicationRecord
  belongs_to :search_filter_preset
  belongs_to :project
end
