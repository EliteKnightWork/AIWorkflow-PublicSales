namespace :once_scripts do
  desc 'is_experience_requiredを埋める'
  task fill_is_experience_required: :environment do
    Project.where(is_experience_required: nil).update_all(is_experience_required: false) # rubocop:disable Rails/SkipsModelValidations
  end
end
