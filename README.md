# 家計管理API

AWS Lambda + API Gateway + DynamoDB + Bedrock を使ったサーバーレス構成の家計管理APIです。
Terraformでインフラをコードで管理し、Cognito JWT認証でエンドポイントを保護しています。

## アーキテクチャ

```
クライアント
    │
    ▼
API Gateway（HTTP API / JWT認証 / CORS / スロットリング）
    │
    ▼
Lambda（FastAPI + Mangum）
    ├── DynamoDB（収支データ）
    ├── Bedrock（Claude Haiku 4.5 / 家計アドバイス）
    └── SNS（予算オーバー通知メール）

CloudWatch Logs（Lambda ログ / 30日保持）
CloudWatch Alarm
    ├── Lambda エラーアラーム → SNS 運用アラートトピック
    └── Bedrock 呼び出し回数アラーム → SNS 運用アラートトピック
```

## 使用技術

| カテゴリ | 技術 |
|----------|------|
| バックエンド | Python / FastAPI / Mangum |
| インフラ | AWS Lambda / API Gateway / DynamoDB / Cognito / Bedrock / SNS / CloudWatch |
| IaC | Terraform |
| 認証 | AWS Cognito（JWT / SRP認証） |
| AI | Amazon Bedrock（Claude Haiku 4.5） |

## APIエンドポイント

すべてのエンドポイントはCognito JWT認証が必要です（`Authorization: Bearer <token>`）。

| メソッド | パス | 説明 |
|----------|------|------|
| POST | /transactions | 収支登録（支出登録時に予算チェック・SNS通知） |
| GET | /transactions | 収支一覧取得 |
| GET | /transactions/summary | 収支集計（収入・支出・残高） |
| GET | /transactions/advice | AIによる家計アドバイス（Bedrock） |

## セットアップ

### 必要なもの

- Python 3.12+
- Terraform 1.0+
- AWS CLI（`terraform` profileの設定が必要）

### 1. リポジトリのクローン

```bash
git clone https://github.com/takatoseki0107/household-api.git
cd household-api
```

### 2. 仮想環境のセットアップ

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. terraform.tfvars の作成

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

`terraform/terraform.tfvars` を編集して通知先メールアドレスを設定します：

```hcl
alert_email = "your-email@example.com"

# 本番環境ではフロントエンドのドメインを指定する
# allowed_origins = ["https://your-frontend-domain.com"]
```

> ⚠️ `terraform.tfvars` は `.gitignore` に含まれています。リポジトリにコミットしないでください。

### 4. Lambda パッケージのビルド

Linux 環境向けにビルドします（Lambda ランタイムが Linux のため必須）：

```bash
cd lambda
pip install -r ../requirements.txt -t . \
  --platform manylinux2014_x86_64 \
  --only-binary=:all: \
  --python-version 3.12
zip -r ../lambda.zip .
cd ..
```

### 5. インフラの構築

```bash
cd terraform
terraform init
terraform apply
```

> ⚠️ **Cognito エラーについて**: `terraform apply` 実行時に `Invalid range for token validity` エラーが表示されることがありますが、Lambda の更新には影響ありません。

`terraform apply` 完了後、以下の情報が出力されます：

```
api_gateway_url      = "https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com"
cognito_user_pool_id = "ap-northeast-1_xxxxxxxxx"
cognito_client_id    = "xxxxxxxxxxxxxxxxxxxxxxxxxx"
lambda_function_name = "household-api-dev"
dynamodb_table_name  = "household-transactions"
```

### 6. SNS サブスクリプションの確認

`terraform apply` 後、`alert_email` に設定したメールアドレスに AWS から確認メールが2通届きます（予算アラート・運用アラートそれぞれ）。
メール内の **「Confirm subscription」** リンクをクリックしてサブスクリプションを有効化してください。

> ⚠️ 確認前は SNS 通知が届きません。必ず両方承認してください。

## 動作確認

### トークンの取得

```bash
TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=<ユーザー名>,PASSWORD='<パスワード>' \
  --client-id <cognito_client_id> \
  --profile terraform \
  --query 'AuthenticationResult.AccessToken' \
  --output text)
```

> ⚠️ `USER_PASSWORD_AUTH` を使う場合は、Cognito コンソールでアプリクライアントに `ALLOW_USER_PASSWORD_AUTH` を手動で追加してください。動作確認後は必ず削除してください。

### 収支の登録

```bash
curl -X POST <api_gateway_url>/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "expense", "amount": 3000, "category": "食費", "date": "2025-01-01"}'
```

### 一覧取得

```bash
curl <api_gateway_url>/transactions \
  -H "Authorization: Bearer $TOKEN"
```

### 収支集計

```bash
curl <api_gateway_url>/transactions/summary \
  -H "Authorization: Bearer $TOKEN"
```

### AIアドバイス取得

```bash
curl <api_gateway_url>/transactions/advice \
  -H "Authorization: Bearer $TOKEN"
```

## 監視

| アラーム | 条件 | 通知先 |
|----------|------|--------|
| Lambda エラー | 5分間で3件以上のエラー | 運用アラート SNS |
| Bedrock 呼び出し過多 | 1時間で100回超 | 運用アラート SNS |
| 予算オーバー | 支出合計が閾値（デフォルト: 10万円）を超過 | 予算アラート SNS |

CloudWatch Logs は `/aws/lambda/household-api-dev` に30日間保持されます。

## 開発について

ブランチ運用（`feature/xxx` → `main`）とPRレビューを取り入れて開発しています。
GitHubのIssueでタスクを管理し、レビュー後にmainへマージする運用です。
