module V1
  module Companies
    class CompanyInformationSerializer < ActiveModel::Serializer
      attributes :company_information

      has_many :offices, serializer: V1::Companies::OfficeSerializer
      has_many :company_attachments, serializer: V1::Companies::CompanyAttachmentSerializer, key: :attachments

      def company_information
        {
          'company_name' => object.name,
          'corporate_number' => object.company_information&.corporate_number,
          'postal_code' => object.company_information&.postal_code,
          'address' => object.company_information&.address,
          'director' => object.company_information&.director,
          'fax_num' => object.company_information&.fax_num,
          'tel_num' => object.company_information&.tel_num,
          'capital' => object.company_information&.capital,
          'employees_num' => object.company_information&.employees_num,
          'industry_type' => object.company_information&.industry_type,
          'business_description' => object.company_information&.business_description,
          'sales' => object.company_information&.sales,
          'established_at' => object.company_information&.established_at&.to_date
        }
      end
    end
  end
end
