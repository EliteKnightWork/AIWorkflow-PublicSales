module V1
  class OrganizationSearchResultSerializer < ActiveModel::Serializer
    attributes :id, :name, :open_projects_count, :bidded_projects_count, :total_projects_count

    attribute :open_projects_count do
      object.open_projects_count.to_i
    end

    attribute :bidded_projects_count do
      object.bidded_projects_count.to_i
    end

    attribute :total_projects_count do
      object.total_projects_count.to_i
    end
  end
end
