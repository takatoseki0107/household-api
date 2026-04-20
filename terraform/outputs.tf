output "api_gateway_url" {
  description = "API Gateway のベースURL"
  value       = aws_apigatewayv2_api.household.api_endpoint
}

output "cognito_user_pool_id" {
  description = "Cognito ユーザープールID"
  value       = aws_cognito_user_pool.household.id
}

output "cognito_client_id" {
  description = "Cognito アプリクライアントID"
  value       = aws_cognito_user_pool_client.household.id
}

output "lambda_function_name" {
  description = "Lambda 関数名"
  value       = aws_lambda_function.household.function_name
}

output "dynamodb_table_name" {
  description = "DynamoDB テーブル名"
  value       = aws_dynamodb_table.household.name
}

output "sns_budget_alert_arn" {
  description = "予算アラート SNS Topic ARN"
  value       = aws_sns_topic.budget_alert.arn
}

output "sns_ops_alert_arn" {
  description = "運用アラート SNS Topic ARN"
  value       = aws_sns_topic.ops_alert.arn
}

output "cloudwatch_log_group" {
  description = "Lambda CloudWatch ロググループ名"
  value       = aws_cloudwatch_log_group.lambda.name
}
