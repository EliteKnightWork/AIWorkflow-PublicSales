module V1
  class GuestFeatureUsagesController < ApplicationController
    def reset
      identifier = request.remote_ip
      if identifier.present?
        usage = GuestFeatureUsage.find_by(identifier: identifier)
        usage&.update!(count: 0)
      end

      head :no_content
    end
  end
end
