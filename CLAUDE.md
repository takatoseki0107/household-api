# Aibo - CLAUDE.md

## プロジェクト概要

**アプリ名**: Aibo（アイボ）  
**コンセプト**: AI × 家計簿 × 相棒 = AIと一緒にお金を管理する家計の相棒アプリ  
**リポジトリ**: https://github.com/takatoseki0107/aibo

---

## 技術スタック

### バックエンド
- **言語**: Python 3.12
- **フレームワーク**: FastAPI + Mangum（Lambda対応）
- **インフラ**: AWS Lambda / API Gateway (HTTP API) / Cognito / DynamoDB / Bedrock / SNS / CloudWatch
- **IaC**: Terraform

### フロントエンド
- **フレームワーク**: React + Vite
- **スタイリング**: TailwindCSS（テラコッタ・オレンジ系テーマ）
- **ホスティング**: AWS Amplify
- **フォルダ**: `frontend/`

---

## フォルダ構成

```
aibo/
├── lambda/main.py       # FastAPI APIハンドラー（Lambdaエントリーポイント: handler）
├── terraform/           # インフラ定義
├── frontend/            # Reactフロントエンド
├── requirements.txt
└── lambda.zip           # Lambdaデプロイパッケージ
```

---

## APIエンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| `POST` | `/transactions` | 収支登録 |
| `GET` | `/transactions` | 収支一覧取得 |
| `GET` | `/transactions/summary` | 収支合計取得 |
| `GET` | `/transactions/advice` | AIアドバイス取得（Bedrock） |

- 認証: Cognito JWT（`Authorization: Bearer <id_token>`）
- DynamoDB: テーブル名 `household-transactions`、パーティションキー `userId`、ソートキー `transactionId`

---

## 重要な実装上の注意

### Lambda / API
- BedrockはJP推論プロファイル `jp.anthropic.claude-haiku-4-5-20251001-v1:0` を使用
- `invoke_model_with_response_stream` でストリーミング取得し、Lambda内でチャンク結合してから返す
- DynamoDBクエリは `LastEvaluatedKey` でページネーション済み（`get_all_items`）
- ユーザーIDは `request.scope["aws.event"]["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]` から取得

### Terraform
- `terraform/` ディレクトリで操作（`lambda.zip` は `../lambda.zip` を参照）
- 変数: `alert_email`（必須）、`environment`（デフォルト: `dev`）、`budget_threshold`
- CORSは `var.allowed_origins` で管理（`terraform/variables.tf` 参照）

### フロントエンド
- `frontend/` フォルダ配下で管理
- Cognito認証フローは SRP（`ALLOW_USER_SRP_AUTH`）
- トークン有効期限: アクセストークン・IDトークン 60分、リフレッシュトークン 30日

---

## 開発コマンド

```bash
# バックエンド開発サーバー
uvicorn lambda.main:app --reload

# フロントエンド開発サーバー
cd frontend && npm run dev

# Lambdaパッケージビルド
pip install -r requirements.txt -t lambda/
cd lambda && zip -r ../lambda.zip .

# Terraformデプロイ
cd terraform
terraform plan -var="alert_email=your@email.com"
terraform apply -var="alert_email=your@email.com"
```
