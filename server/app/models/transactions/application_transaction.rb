module Transactions
  class ApplicationTransaction
    attr_reader :errors

    def initialize
      @errors = []
    end

    def exec
      raise NotImplementedError
    end

    private

    def with_transaction(&)
      ActiveRecord::Base.transaction do
        yield

        raise ActiveRecord::Rollback if @errors.present?
      end

      @errors.uniq!
      @errors.blank? # NOTE: 保存成功ならtrueを返す
    end

    # NOTE: with_transactionの中では通常のsaveではなくコレを使う
    def save_in_transaction(object, **)
      return if object.save(**)

      @errors.concat(object.errors.full_messages)
    end

    # NOTE: with_transactionの中では通常のupdateではなくコレを使う
    def update_in_transaction(object, params)
      return if object.update(params)

      @errors.concat(object.errors.full_messages)
    end

    # NOTE: with_transactionの中では通常の<<ではなくコレを使う
    def save_collection_in_transaction(collection, object)
      return if collection << object

      messages = Array(object).flat_map { |obj| obj.errors.full_messages }
      @errors.concat(messages)
    end

    # NOTE: with_transactionの中では通常のdestroyではなくコレを使う
    def destroy_in_transaction(object)
      return if object.destroy

      error_messages = object.errors.full_messages
      error_messages << "#{object.model_name.human}の削除に失敗しました。" if error_messages.blank?
      @errors.concat(error_messages)
    end
  end
end
