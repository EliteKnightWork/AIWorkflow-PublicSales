Seeder.seed do
  Rake::Task["db_import:participate_qualifications"].invoke
  Rake::Task["db_import:security_qualifications"].invoke
end
