module UserSearchable
  extend ActiveSupport::Concern

  class_methods do
    def search(params)
      query = self.includes(:company)

      # 名前による検索
      if params[:name].present?
        query = query.where('name LIKE ?', "%#{ActiveRecord::Base.sanitize_sql_like(params[:name])}%")
      end

      # メールアドレスによる検索
      if params[:email].present?
        query = query.where('email LIKE ?', "%#{ActiveRecord::Base.sanitize_sql_like(params[:email])}%")
      end

      # ページネーションの設定
      page_number = params[:page].to_i.zero? ? 1 : params[:page].to_i
      per_page = params[:per_page] || 25

      # ソート順の設定
      query = query.order(created_at: :desc)

      # ページネーションの適用
      result = query.page(page_number).per(per_page)
      
      result
    end
  end
end