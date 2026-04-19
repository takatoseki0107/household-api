# 家計管理API

AWS Lambda + API Gateway + DynamoDB + Bedrock を使ったサーバーレス構成の家計管理APIです。
Terraformでインフラをコード管理し、Cognito JWT認証でエンドポイントを保護しています。

## 使用技術

| カテゴリ | 技術 |
|----------|------|
| バックエンド | Python / FastAPI / Mangum |
| インフラ | AWS Lambda / API Gateway / DynamoDB / Cognito / Bedrock |
| IaC | Terraform |
| 認証 | AWS Cognito（JWT / SRP認証） |
| AI | Amazon Bedrock（Claude Haiku 4.5） |

## APIエンドポイント

すべてのエンドポイントはCognito JWT認証が必要です。

| メソッド | パス | 説明 |
|----------|------|------|
| POST | /transactions | 収支登録 |
| GET | /transactions | 収支一覧取得 |
| GET | /transactions/summary | 収支集計（収入・支出・残高） |
| GET | /transactions/advice | AIによる家計アドバイス（Bedrock） |

## ローカル環境のセットアップ

### 必要なもの

- Python 3.12+
- Terraform 1.0+
- AWS CLI（`terraform` profileの設定が必要）

### 仮想環境のセットアップ

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Lambdaパッケージのビルド

```bash
cd lambda
pip install -r ../requirements.txt -t .
zip -r ../lambda.zip .
```

### インフラの構築

```bash
cd terraform
terraform init
terraform apply
```

## 開発について

ブランチ運用（`feature/xxx` → `main`）とPRレビューを取り入れて開発しています。
GitHubのIssueでタスクを管理し、レビュー後にmainへマージする運用です。
