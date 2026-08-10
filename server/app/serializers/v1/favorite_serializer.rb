module V1
  class FavoriteSerializer < ActiveModel::Serializer
    has_one :project, serializer: V1::ProjectSerializer

    attribute :registered_by do
      object.user.name.presence || object.user.email
    end

    attribute :registered_by_list do
      object.project.favorites.where(user: @instance_options[:users]).includes(:user).map { |f| f.user.name.presence || f.user.email }
    end
  end
end
