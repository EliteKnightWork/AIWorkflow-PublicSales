# == Schema Information
#
# Table name: project_reactions
# Database name: primary
#
#  id                                         :bigint           not null, primary key
#  reaction(リアクションタイプ(like/dislike)) :integer          not null
#  created_at                                 :datetime         not null
#  updated_at                                 :datetime         not null
#  project_id(案件ID)                         :bigint           not null
#  user_id(ユーザーID)                        :bigint           not null
#
# Indexes
#
#  index_project_reactions_on_project_id              (project_id)
#  index_project_reactions_on_project_id_and_user_id  (project_id,user_id) UNIQUE
#  index_project_reactions_on_user_id                 (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#
require "rails_helper"

RSpec.describe ProjectReaction, type: :model do
  describe "associations" do
    it { is_expected.to belong_to(:project) }
    it { is_expected.to belong_to(:user) }
  end

  describe "validations" do
    subject { build(:project_reaction) }

    it { is_expected.to validate_presence_of(:reaction) }
    it { is_expected.to validate_uniqueness_of(:project_id).scoped_to(:user_id) }
  end

  describe "enums" do
    it do
      expect(described_class.reactions).to eq({
        'dislike' => -1,
        'neutral' => 0,
        'like' => 1
      })
    end
  end
end
