namespace :once_scripts do
  task :migrate_business_description_formats => :environment do
    BusinessDescriptionFormat.find_each do |business_description_format|
      business_description_format.save!
    end
  end
end
