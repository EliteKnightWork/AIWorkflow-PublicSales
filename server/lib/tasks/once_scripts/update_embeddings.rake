namespace :once_scripts do
  desc '次元数が間違っているembeddingを修正する'
  task :update_embeddings => :environment do
    project_ids = ProjectEmbedding.where("JSON_LENGTH(embedding->'$.embedding') != 768").pluck(:project_id)
    Project.where(id: project_ids).find_each do |project|
      project.project_embeddings.destroy_all
      project.send(:build_project_embeddings)
    end
  end
end
