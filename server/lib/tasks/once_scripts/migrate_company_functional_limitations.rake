namespace :once_scripts do
  task :migrate_company_functional_limitations => :environment do
    Company.where.missing(:company_functional_limitation).find_each do |company|
      company.create_company_functional_limitation!
    end
  end
end
