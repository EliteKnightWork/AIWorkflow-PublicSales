class ProjectSimilarProjectsFetcher
  EMBEDDING_TYPE = 'project_summary_embeddings'.freeze

  def initialize(project:, company_id:, size: 10)
    @project = project
    @company_id = company_id
    @size = size
  end

  def call
    prepare_project_for_similarity

    knn_vector = summary_embedding_vector
    return Project.none if knn_vector.blank?

    result = Project.for_company(@company_id).similar_projects_search(knn_vector, search_args)
    project_ids = result.records.ids.reject { |id| id.to_i == @project.id }

    fetch_projects(project_ids)
  end

  private

  def prepare_project_for_similarity
    if @project.procedure_type_group == '企画競争入札' && @project.summary.nil?
      @project.summarize_and_save_summary
    end

    build_summary_embedding_if_needed
    @project.extract_keywords_and_save if @project.keywords.nil?
  end

  def build_summary_embedding_if_needed
    return if summary_embedding_record.present?

    text = @project.summary || @project.description || @project.title
    @project.build_project_summary_embedding(text)
  end

  def summary_embedding_record
    @project.project_embeddings.where(embedding_type: EMBEDDING_TYPE).order(created_at: :desc).first
  end

  def summary_embedding_vector
    summary_embedding_record&.embedding&.fetch('embedding', nil)
  end

  def search_args
    {
      keywords: @project.keywords.presence,
      prefecture: @project.prefecture_name.present? ? [@project.prefecture_name] : nil,
      planned_price_from: planned_price_from,
      planned_price_to: planned_price_to,
      publication_date_from: publication_date_from,
      publication_date_to: publication_date_to,
      summary: @project.summary.presence,
      size: @size
    }
  end

  def planned_price_from
    return nil if @project.planned_price.nil?

    @project.planned_price - 5_000_000
  end

  def planned_price_to
    return nil if @project.planned_price.nil?

    @project.planned_price + 5_000_000
  end

  def publication_date_from
    @project.publication_date&.-(5.days)
  end

  def publication_date_to
    @project.publication_date&.+(5.days)
  end

  def fetch_projects(project_ids)
    return Project.none if project_ids.empty?

    Project.for_company(@company_id).
      includes(:lg_codes, :project_security_qualifications, external_documents: { file_attachment: :blob }, screenshots: { file_attachment: :blob }).
      where(id: project_ids).
      in_order_of(:id, project_ids)
  end
end
