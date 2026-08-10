module Notifiable
  extend ActiveSupport::Concern

  included do
    has_one :notification_method, as: :notifiable, dependent: :destroy
  end
end
