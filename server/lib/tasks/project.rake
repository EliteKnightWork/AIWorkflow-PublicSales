namespace :project do
  desc 'rake タスクテスト'
  task :create_summary_embedding, [:start_id,:end_id,:batch_size] => :environment do |_, args|
    start_id = (args[:start_id] || 1).to_i
    end_id = (args[:end_id] || Project.last.id).to_i
    batch_size = (args[:batch_size] || 100).to_i

    Project.where(id: start_id..end_id).in_batches(of: batch_size) do |batch|
      exist_ids_set = ProjectEmbedding
                    .where(project_id: batch.select(:id))
                    .where(embedding_type: 'project_summary_embeddings')
                    .pluck(:project_id)
                    .to_set

      batch.each do |project|
        next if exist_ids_set.include?(project.id)
        create_summary_and_summary_embedding(project)
      end
    end
  end

  def create_summary_and_summary_embedding(project)
    begin
      if project.procedure_type_group == '企画競争入札'
        summary = project.summarize_and_save_summary if project.summary.nil?
        text = summary || project.description || project.title
        project.build_project_summary_embedding(text) if project.project_embeddings.where(embedding_type: 'project_summary_embeddings').empty? && text.present?
      else
        text = project.description || project.title
        project.build_project_summary_embedding(text) if project.project_embeddings.where(embedding_type: 'project_summary_embeddings').empty? && text.present?
      end
    rescue => e
      Rails.logger.error(e)
    end
  end
end
