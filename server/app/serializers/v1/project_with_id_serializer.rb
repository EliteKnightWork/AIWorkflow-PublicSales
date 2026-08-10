module V1
  class ProjectWithIdSerializer < V1::ProjectSerializer
    attribute :id do
      object.id
    end
  end
end
