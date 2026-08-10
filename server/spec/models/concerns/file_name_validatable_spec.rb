require 'rails_helper'

# Concernをテストするためのダミークラス
class DummyModel < ApplicationRecord
  self.table_name = 'users' # 既存のテーブルを使用

  has_one_attached :file
  include FileNameValidatable
end

RSpec.describe FileNameValidatable, type: :model do
  let(:dummy_model) { DummyModel.new }

  describe '#file_has_valid_filename' do
    context 'ファイルが有効なファイル名でアタッチされている場合' do
      it 'バリデーションが通る' do
        dummy_model.file.attach(
          io: Rails.root.join('spec/fixtures/dummy.pdf').open,
          filename: 'test.pdf'
        )
        expect(dummy_model).to be_valid
      end
    end

    context 'ファイルが空白文字のみのファイル名でアタッチされている場合' do
      it 'バリデーションエラーが発生する' do
        dummy_model.file.attach(
          io: Rails.root.join('spec/fixtures/dummy.pdf').open,
          filename: '   '
        )
        expect(dummy_model).not_to be_valid
        expect(dummy_model.errors[:file]).to include('ファイル名を入力してください')
      end
    end
  end
end
