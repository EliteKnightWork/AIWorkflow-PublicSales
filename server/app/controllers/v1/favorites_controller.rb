module V1
  class FavoritesController < ApplicationController
    serialization_scope :current_user

    def index
      # NOTE: 組織に所属していない場合は自身のお気に入りのみを返す
      owner = current_user.company || current_user
      favorites = owner.favorites.includes(
        :user,
        project: [
          :lg_codes,
          :project_security_qualifications,
          { external_documents: { file_attachment: :blob } },
          { screenshots: { file_attachment: :blob } }
        ]
      ).order(projects: build_order_param(params[:sort_by]))
      favorites = favorites.where(user_id: params[:user_ids]) if params[:user_ids].present?

      uniq_favorites = favorites.group_by { |f| f.project_id }.map { |_, group| group.first }

      render(
        json: uniq_favorites,
        each_serializer: V1::FavoriteSerializer,
        include: {
          project: [
            :external_documents,
            :screenshots,
          ]
        },
        adapter: :json,
        current_user: current_user,
        users: current_user.company.nil? ? current_user : current_user.company.users,
        root: 'favorites'
      )
    end

    def create
      project = Project.for_company(current_user.company_id).find_by(uuid: params[:uuid])
      favorite = current_user.favorites.find_or_initialize_by(project: project) do |f|
        f.user = current_user
      end

      if favorite.save
        render json: {}, status: :created
      else
        render json: { erros: ['お気に入り登録に失敗しました'] }, status: :internal_server_error
      end
    end

    def destroy
      project = Project.for_company(current_user.company_id).find_by!(uuid: params[:uuid])
      favorite = current_user.favorites.find_by!(project: project)

      if favorite.destroy
        render json: {}, status: :ok
      else
        render json: { errors: ['お気に入り解除に失敗しました'] }, status: :internal_server_error
      end
    end

    def check
      owner = current_user.company || current_user
      project = Project.for_company(current_user.company_id).find_by(uuid: params[:uuid])
      favorite = owner.favorites.find_by(project: project)

      render json: { isFavorite: favorite.present? }
    end

    private

    def build_order_param(sort_by)
      case sort_by
      when 'publication_date_asc'
        { publication_date: :asc }
      else
        { publication_date: :desc }
      end
    end
  end
end
