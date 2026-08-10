class AwardedProjectSimilarProjectsFetcher
  def initialize(project:, company_id:, size: 5)
    @project = project
    @company_id = company_id
    @size = size
  end

  def call
    result = Project.for_company(@company_id).similar_projects_by_awarded_project_search(
      @project.title,
      prefecture_codes,
      size: @size
    )

    project_ids = result.records.ids.reject { |id| id.to_i == @project.id }
    fetch_projects(project_ids)
  end

  private

  def prefecture_codes
    codes = @project.lg_codes.filter_map(&:code)
    return codes if codes.present?

    prefecture_code = LgCodeConverter.to_code(@project.prefecture_name)
    prefecture_code ? [prefecture_code] : []
  end

  def fetch_projects(project_ids)
    return Project.none if project_ids.empty?

    Project.for_company(@company_id).
      includes(:lg_codes, :project_security_qualifications, external_documents: { file_attachment: :blob }, screenshots: { file_attachment: :blob }).
      where(id: project_ids).
      in_order_of(:id, project_ids)
  end
end
