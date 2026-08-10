# 入札案件と落札案件の共通ロジックをまとめたモジュール
module ProjectAndAwardedProjectCommon
  extend ActiveSupport::Concern

  class_methods do
    def determine_procedure_type_group(procedure_type)
      return 'その他' if procedure_type.nil?
    
      case procedure_type
      when ->(pt) { ['指名競争', '工事希望型指名競争入札', '公募指名', '希望指名'].any? { |term| pt.include?(term) } }
        '指名競争入札'
      when ->(pt) { ['公募プロポーザル', '企画競争', 'プロポーザル', 'コンペ', '技術提案'].any? { |term| pt.include?(term) } }
        '企画競争入札'
      when ->(pt) { ['随意契約', '特命契約', '少額契約', '不落契約'].any? { |term| pt.include?(term) } }
        '随意契約'
      when ->(pt) { ['見積合わせ', '見積もり合わせ', 'オープンカウンタ', 'オープンカウンター', 'オープンビッド'].any? { |term| pt.include?(term) } }
        '見積もり合わせ'
      when ->(pt) { ['資料招請', '資料提供招請', '情報提供招請', 'RFI'].any? { |term| pt.include?(term) } }
        '資料招請'
      when ->(pt) { ['RFC', '意見招請'].any? { |term| pt.include?(term) } }
        '意見招請'
      when ->(pt) { pt.include?('一般競争') }
        '一般競争入札'
      else
        'その他'
      end
    end
  end
end
