Seeder.seed do
  def create_company(name:)
    company = Company.find_by(name: name) || FactoryBot.create(:company, name: name)
    company
  end

  create_company(name: "株式会社Nehan")
end
