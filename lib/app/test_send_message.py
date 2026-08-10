import boto3
import json

# LocalStack用のエンドポイント設定
sqs = boto3.client(
    'sqs',
    endpoint_url='http://localhost:4566',
    region_name='ap-northeast-1',
    aws_access_key_id='dummy',
    aws_secret_access_key='dummy'
)

# キューのURLを取得
queue_url = sqs.get_queue_url(QueueName='labid-queue')['QueueUrl']

# テストメッセージを送信
message = {
    'test': 'Hello from LocalStack!',
    'timestamp': '2024-04-14 12:00:00'
}

response = sqs.send_message(
    QueueUrl=queue_url,
    MessageBody=json.dumps(message)
)

print('Message sent. MessageId:', response['MessageId']) 