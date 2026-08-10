namespace :once_scripts do
  desc 'Auth0からemailを取得してusersテーブルに保存'
  task :populate_email_from_auth0 => :environment do
    Rails.logger.info("=== Start populate_email_from_auth0 #{Time.zone.now} ===")

    User.where.not(auth0_user_id: nil).find_each do |user|
      email = user.auth0_email
      user.update(email: email) if email.present?
    end

    Rails.logger.info("=== End populate_email_from_auth0 #{Time.zone.now} ===")
  end
end
