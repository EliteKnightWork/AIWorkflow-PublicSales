Seeder.seed do
  def create_project(raw_title:, with_awarded_project: false)
    project = Project.find_by(raw_title:) || FactoryBot.create(:project, raw_title:)

    # 関連データの作成
    FactoryBot.create_list(:project_lg_code, 1, project:)
    FactoryBot.create_list(:external_document, 2, attachable: project)
    FactoryBot.create_list(:screenshot, 2, attachable: project)
    FactoryBot.create_list(:source_file, 2, attachable: project)
    FactoryBot.create(:awarded_project, :with_bidders, project:) if with_awarded_project

    project
  end

  100.times do |i|
    with_awarded_project = i.even?
    create_project(raw_title: "project_#{i}", with_awarded_project:)
  end
end
