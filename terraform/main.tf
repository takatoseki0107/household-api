terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region  = "ap-northeast-1"
  profile = var.aws_profile
}

resource "aws_dynamodb_table" "household" {
  name         = "household-transactions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "transactionId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "transactionId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "household-transactions"
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool" "household" {
  name = "household-user-pool-${var.environment}"

  password_policy {
    minimum_length    = 12
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
  }

  auto_verified_attributes = ["email"]

  tags = {
    Name        = "household-user-pool-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_client" "household" {
  name         = "household-app-client"
  user_pool_id = aws_cognito_user_pool.household.id

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
}
