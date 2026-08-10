import os
import boto3
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

class S3Service:
    def __init__(self):
        """
        S3サービスの初期化
        ローカル環境ではMinIOを使用するための設定も含む
        """
        self.bucket_name = os.environ.get('S3_BUCKET_NAME')
        
        endpoint_url = os.environ.get('S3_ENDPOINT_URL')
        
        # S3クライアントの初期化
        # ローカル環境の場合のみ明示的な認証情報を設定
        if os.environ.get('NODE_ENV') == 'local':
            self.s3_client = boto3.client(
                's3',
                endpoint_url=endpoint_url,
                aws_access_key_id='root',
                aws_secret_access_key='password',
                region_name='ap-northeast-1'
            )
        else:
            # 本番環境ではIAMロールを使用するため認証情報は不要
            self.s3_client = boto3.client(
                's3',
                endpoint_url=endpoint_url if endpoint_url else None,
                region_name=os.environ.get('AWS_REGION', 'ap-northeast-1')
            )
        
        logger.info(f"S3Service initialized with bucket: {self.bucket_name}")
        
    def upload_file(self, file_data, object_key):
        """
        ファイルをS3/MinIOにアップロード
        
        Args:
            file_data: アップロードするファイルデータ（バイト列またはファイルオブジェクト）
            object_key: S3内のオブジェクトキー（パス）
            
        Returns:
            bool: アップロード成功時はTrue、失敗時はFalse
        """
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=object_key,
                Body=file_data
            )
            logger.info(f"File uploaded successfully to {self.bucket_name}/{object_key}")
            return True
        except ClientError as e:
            logger.error(f"Error uploading file to S3: {e}")
            raise e
            
    def download_file(self, object_key):
        """
        S3/MinIOからファイルをダウンロード
        
        Args:
            object_key: S3内のオブジェクトキー（パス）
            
        Returns:
            bytes: ファイルデータ、エラー時はNone
        """
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=object_key
            )
            file_data = response['Body'].read()
            logger.info(f"File downloaded successfully from {self.bucket_name}/{object_key}")
            return file_data
        except ClientError as e:
            logger.error(f"Error downloading file from S3: {e}")
            return None
