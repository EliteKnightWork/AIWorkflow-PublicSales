class UserMailerPreview < ActionMailer::Preview
  def new_projects
    user = User.last
    projects = Project.last(5)
    search_filter_preset = SearchFilterPreset.last
    UserMailer.with(user: user, projects: projects, search_filter_preset: search_filter_preset).new_projects
  end
end
