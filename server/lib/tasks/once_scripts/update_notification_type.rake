namespace :once_scripts do
  task update_notification_type: :environment do
    puts 'notification_typeの更新を開始します...'

    NotificationMethod.find_each do |notification_method|
      next unless notification_method.notification_type.nil?

      notification_method.update(notification_type: 'new_project')
    end

    puts '更新が完了しました'
  end
end
