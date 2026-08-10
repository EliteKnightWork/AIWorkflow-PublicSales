namespace :once_scripts do
  desc 'Modify future publication date for all projects'
  task :modify_future_publication_date => :environment do
    projects = Project.where('publication_date > ?', Time.zone.now.to_date)
    projects.find_each do |project|
      project.publication_date = project.registration_date
      project.save!
    end
  end
end
