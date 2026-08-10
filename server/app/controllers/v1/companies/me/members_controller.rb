module V1
  module Companies
    module Me
      class MembersController < ApplicationController
        def index
          # NOTE: 組織に属していない場合は自分の情報のみを返す
          members = current_user&.company&.users || [current_user]

          render(
            json: members,
            each_serializer: V1::UserSerializer,
            adapter: :json,
            root: 'members'
          )
        end
      end
    end
  end
end
