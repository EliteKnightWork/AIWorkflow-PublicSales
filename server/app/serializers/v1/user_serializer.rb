module V1
  class UserSerializer < ActiveModel::Serializer
    attributes :id, :email, :name, :company_id

    belongs_to :company, if: -> { object.company.present? }

    attribute :authorized_providers, if: :include_authorized_providers? do
      object.user_tokens.map do |token|
        token.token_provider
      end
    end

    def include_authorized_providers?
      instance_options[:include_authorized_providers] || false
    end
  end
end
