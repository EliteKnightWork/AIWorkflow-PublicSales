Seeder.seed do
  def create_browsing_history(browsable:, user:)
    BrowsingHistory.find_by(browsable: browsable, user: user) || FactoryBot.create(:browsing_history, browsable: browsable, user: user)
  end

  user = User.first
  project = Project.first
  create_browsing_history(browsable: project, user: user)

  awarded_project = AwardedProject.first
  create_browsing_history(browsable: awarded_project, user: user)
end
