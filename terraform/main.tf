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

resource "aws_iam_role" "lambda" {
  name = "household-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "household" {
  filename         = "${path.module}/../lambda.zip"
  function_name    = "household-api-${var.environment}"
  role             = aws_iam_role.lambda.arn
  handler          = "main.handler"
  runtime          = "python3.12"
  source_code_hash = filebase64sha256("${path.module}/../lambda.zip")

  tags = {
    Name        = "household-api-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_api" "household" {
  name          = "household-api-${var.environment}"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "household" {
  api_id                 = aws_apigatewayv2_api.household.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.household.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_authorizer" "household" {
  api_id           = aws_apigatewayv2_api.household.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "household-cognito-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.household.id]
    issuer   = "https://cognito-idp.ap-northeast-1.amazonaws.com/${aws_cognito_user_pool.household.id}"
  }
}

resource "aws_apigatewayv2_route" "household" {
  api_id             = aws_apigatewayv2_api.household.id
  route_key          = "GET /"
  target             = "integrations/${aws_apigatewayv2_integration.household.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.household.id
}

resource "aws_apigatewayv2_stage" "household" {
  api_id      = aws_apigatewayv2_api.household.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "household" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.household.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.household.execution_arn}/*/*"
}
resource "aws_iam_policy" "lambda_dynamodb" {
  name = "household-lambda-dynamodb-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.household.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda_dynamodb.arn
}

resource "aws_apigatewayv2_route" "post_transactions" {
  api_id             = aws_apigatewayv2_api.household.id
  route_key          = "POST /transactions"
  target             = "integrations/${aws_apigatewayv2_integration.household.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.household.id
}

resource "aws_apigatewayv2_route" "get_transactions" {
  api_id             = aws_apigatewayv2_api.household.id
  route_key          = "GET /transactions"
  target             = "integrations/${aws_apigatewayv2_integration.household.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.household.id
}

resource "aws_apigatewayv2_route" "get_transactions_summary" {
  api_id             = aws_apigatewayv2_api.household.id
  route_key          = "GET /transactions/summary"
  target             = "integrations/${aws_apigatewayv2_integration.household.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.household.id
}
