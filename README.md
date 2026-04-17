# 家計管理API

AWS Lambda + API Gateway + DynamoDB を使ったサーバーレス構成の家計管理APIです。
Terraformでインフラをコード管理し、Cognito JWT認証でエンドポイントを保護しています。

## 使用技術

| カテゴリ | 技術 |
|----------|------|
| バックエンド | Python / FastAPI |
| インフラ | AWS Lambda / API Gateway / DynamoDB / Cognito |
| IaC | Terraform |
| 認証 | AWS Cognito（JWT） |

## ローカル環境のセットアップ

### 必要なもの

- Python 3.12+
- Terraform 1.0+
- AWS CLI（`terraform` profileの設定が必要）

### Lambdaパッケージのビルド

```bash
zip -j lambda.zip lambda/main.py
```

### インフラの構築

```bash
cd terraform
terraform init
terraform apply
```

## 開発について

ブランチ運用（`feature/xxx` → `main`）とPRレビューを取り入れて開発しています。
