# == Schema Information
#
# Table name: project_embeddings
# Database name: primary
#
#  id                                                                   :bigint           not null, primary key
#  embedding(埋め込み情報)                                              :json             not null
#  embedding_type(project_embeddings または project_summary_embeddings) :string(255)      default("project_embeddings"), not null
#  raw_text(埋め込み前のテキスト)                                       :text(4294967295) not null
#  created_at                                                           :datetime         not null
#  updated_at                                                           :datetime         not null
#  project_id(公告情報ID)                                               :bigint           not null
#
# Indexes
#
#  index_project_embeddings_on_project_id  (project_id)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#
class ProjectEmbedding < ApplicationRecord
  belongs_to :project

  validates :raw_text, presence: true
  validates :embedding, presence: true
end
