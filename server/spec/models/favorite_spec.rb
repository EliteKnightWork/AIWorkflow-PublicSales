# == Schema Information
#
# Table name: favorites
# Database name: primary
#
#  id                     :bigint           not null, primary key
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  project_id(公告情報ID) :bigint           not null
#  user_id(ユーザーID)    :bigint           not null
#
# Indexes
#
#  index_favorites_on_project_id              (project_id)
#  index_favorites_on_user_id                 (user_id)
#  index_favorites_on_user_id_and_project_id  (user_id,project_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#
require 'rails_helper'

RSpec.describe Favorite do
  describe 'associations' do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:project) }
  end

  describe 'validations' do
    subject { build(:favorite) }

    it { is_expected.to validate_uniqueness_of(:project_id).scoped_to(:user_id) }
  end
end
