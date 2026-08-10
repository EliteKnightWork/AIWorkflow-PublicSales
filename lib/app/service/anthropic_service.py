import os
import logging
import anthropic
from typing import List, Dict, Any, Optional
from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage, AIMessage, SystemMessage

logger = logging.getLogger(__name__)

from pydantic import BaseModel, Field
from typing import Dict, List, Union

class ProposalContentItem(BaseModel):
    """提案書の各カテゴリーの内容項目を表すモデル"""
    category: str = Field(description="提案書のカテゴリー名")
    content: List[str] = Field(description="カテゴリーに含まれる具体的な内容項目のリスト")
    evaluation: str = Field(description="評価基準、審査基準、審査内容のどこに該当するのかの根拠")
    ideas: List[str] = Field(description="カテゴリーの内容として記載するべきアイデアのリスト")

class ProposalOutline(BaseModel):
    """提案書の全体構成を表すモデル"""
    items: Dict[str, ProposalContentItem] = Field(
        description="提案書の構成項目。キーは項目番号（文字列）、値は各カテゴリーとその内容"
    )



class AnthropicService:
    """
    Anthropic APIを使用してClaudeモデルとやり取りするためのサービスクラス
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "claude-3-5-haiku-20241022"):
        """
        AnthropicServiceのインスタンスを初期化します
        
        Args:
            api_key: Anthropic API キー。指定されない場合は環境変数から取得します
            model: 使用するClaudeモデル名
        """
        self.api_key = api_key or os.environ.get('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("Anthropic API キーが指定されていません。引数または環境変数で設定してください。")
        
        self.model = model
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.langchain_client = ChatAnthropic(model_name=model, anthropic_api_key=self.api_key)
    
    def extract_proposal_outline(self, pdfText: str):
        # JSONの例示部分を別の変数として定義
        json_example = """
                {
                    "1": {
                        "category": "ページ1のタイトル",
                        "content": [
                            "項目1: 内容詳細",
                            "項目2: 内容詳細",
                            "項目3: 内容詳細",
                            "項目4: 内容詳細",
                            "項目5: 内容詳細"
                        ],
                        "evaluation": "評価基準、審査基準、審査内容のどこに該当するのかの根拠",
                        "ideas": [
                            "アイデア1",
                            "アイデア2",
                            "アイデア3"
                        ]
                    },
                    "2", {
                        "category": "ページ2のタイトル",
                        "content": [
                            "項目1: 内容詳細",
                            "項目2: 内容詳細",
                            "項目3: 内容詳細",
                            "項目4: 内容詳細",
                            "項目5: 内容詳細"
                        ],
                        "evaluation": "評価基準、審査基準、審査内容のどこに該当するのかの根拠",
                        "ideas": [
                            "アイデア1",
                            "アイデア2",
                            "アイデア3"
                        ]
                    }
                }"""

        prompt = """
            あなたは10年以上企画会社でトッププレイヤーだったプロのプランナーです。
            
            テキスト情報から、以下の手順で提案書の構成（アウトライン）を作成してください。
            まず最初に、提案書のページに相当する項目を以下の事項を踏まえて20項目まで出力してください。
            ・基本的な構成としては、テキストに記載されている内容を踏まえて、論理的な流れ（例：背景と目的 → 現状課題 → 解決策 → 実施体制 → 効果検証 → 実績・強み → まとめ）を意識して作成すること
            ・表紙/目次に該当する項目は含めないこと
            ・論理的な流れを意識しつつ、記載されている各評価項目（例：提案の妥当性、体制、独自性、実績、価格など）を全て網羅できる構成にすること
            ・審査基準が明確な場合は、審査基準についてはその審査基準ごとに項目を分けること            
            項目を作成したらその項目について、以下の出力形式を参照して、ファイルに記載されている情報を元に提案書に網羅すべき内容をできるだけ具体的に記入してください。
            構成を作成したらダブルチェックを行い、評価基準や審査基準、および審査内容に記載されている全ての基準や内容を必ず構成に網羅されているか入念に見てください。必要であれば加筆修正をしてください。
            
            **【出力形式】**
            ■category
            ・アウトラインの項目名

            ■content
            ・categoryの項目について、ファイルに記載されている中から提案書に網羅すべき内容をできるだけ具体的に記入してください。
            ・定量的に表現・記載すべき箇所はその数字もしっかりと記載してください。

            ■evaluation
            ・categoryの項目について、審査基準/評価基準のどの項目に該当しているのか、その配点も記載してください。審査基準/評価基準と紐づく項目でない場合はハイフン("-")を記載してください。
            （例：該当審査基準：企画提案内容「フォロワー数やインフルエンサーとしての実績など、発信力・拡散力のあるクリエイターを起用しているか」10点）

            ■ideas
            ・categoryの項目について、案件を落札するためにどのような工夫をすれば良いか企画やアイデアを考えて提案事項を3つほど記載してください。

            ** JSON出力例 **

            {json_example}

            重要事項：
            1. 各contentには評価基準に記載されている要素を具体的に入れる
            2. JSONの構造は厳密に守る
            3. 文字列はすべて二重引用符で囲む
            4. 「実施体制」の項目を必ず含める
            5. 配列要素の最後にカンマを付けない
            6. 内容はすべて1つのJSONオブジェクトとして出力

            ---
            {pdfText}
            ---
            """
        
        # プロンプト内の{pdfText}と{json_example}を実際の値で置換
        formatted_prompt = prompt.format(pdfText=pdfText, json_example=json_example)

        return self.get_summary_from_claude(formatted_prompt)


    def get_summary_from_claude(self, prompt: str, retry_count: int = 3) -> str:
        """
        Claudeを使用して要約情報を取得します
        
        Args:
            prompt: Claudeに送信するプロンプト
            retry_count: リトライ回数
            
        Returns:
            Claudeからの応答（JSON形式の文字列）
        """
        try:
            for attempt in range(1, retry_count + 1):
                retry_count+=1
                logger.info(f"情報抽出を開始しています（Attempt {attempt}）")
                
                # Attempt間で温度を下げていく（より決定的にする）
                temperature = max(0.1, 0.3 - (attempt * 0.1))
                
                # JSON形式出力を促すプロンプト
                json_format_prompt = """
                    重要: 回答は必ず有効なJSON形式で提供してください。JSONの前後に説明文や追加テキストは含めないでください。
                    そのまま解析できる完全なJSONだけを出力してください。JSON内のすべての文字列は必ずダブルクォートで囲み、
                    エスケープが必要な文字（例: \\", \\\\, \\n）は適切にエスケープしてください。
                    長いテキストや複雑な説明は避け、シンプルな形式を保ってください。
                    """
                
                # プロンプトを強化
                enhanced_prompt = prompt + "\n\n" + json_format_prompt
                
                # LangChainを使用
                response = self.langchain_client.invoke(
                    [HumanMessage(content=enhanced_prompt)],
                    max_tokens=8192,
                    temperature=temperature
                )

                try:
                    # 応答をJSONとして解析
                    import json
                    logger.info(f"応答: {response.content}")
                    response_dict = json.loads(response.content)
                    
                    # ProposalOutlineモデルに変換
                    outline = ProposalOutline(items=response_dict)
                    return outline.model_dump_json()
                except json.JSONDecodeError as e:
                    logger.error(f"JSONの解析に失敗しました: {e}")
                    if attempt == retry_count:
                        raise
                    continue
        except Exception as e:
            logger.error(f"Claude APIとの通信中にエラーが発生しました: {e}")
            raise