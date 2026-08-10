from typing import Optional
from repository.base import BaseRepository
from models.company import Company
from core.logging import get_logger

logger = get_logger("company_repository")


class CompanyRepository(BaseRepository[Company]):
    """会社リポジトリ（プラン確認用）"""

    def __init__(self):
        super().__init__(Company)

    def _get_table_name(self) -> str:
        return "companies"

    def _map_to_model(self, data: dict) -> Company:
        return Company(**data)

    def get_company_by_id(self, company_id: int) -> Optional[Company]:
        try:
            # companiesのid, nameと、そのcompanyに紐付くfeatureのkey一覧を取得する
            query = """
                SELECT 
                    c.id, 
                    c.name, 
                    GROUP_CONCAT(f.key) AS features
                FROM companies c
                LEFT JOIN company_features cf ON c.id = cf.company_id
                LEFT JOIN features f ON cf.feature_id = f.id
                WHERE c.id = :id
                GROUP BY c.id, c.name
            """
            results = self.execute_query(query, {"id": company_id})
            if not results:
                return None

            data = results[0].copy()
            # featuresはカンマ区切り文字列か空文字になりうる
            features_str = data.get("features", "")
            if features_str:
                features = [f.strip() for f in features_str.split(",") if f.strip()]
            else:
                features = []
            data["features"] = features

            return self._map_to_model(data)
        except Exception as e:
            logger.error(f"Failed to get company by id {company_id}: {str(e)}")
            raise


