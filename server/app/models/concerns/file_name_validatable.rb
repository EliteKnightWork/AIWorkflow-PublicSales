module FileNameValidatable
  extend ActiveSupport::Concern

  included do
    validate :file_has_valid_filename
  end

  private

  def file_has_valid_filename
    return unless file.attached?

    filename = file.filename.to_s.strip
    if filename.blank?
      errors.add(:file, 'ファイル名を入力してください')
    end
  end
end
