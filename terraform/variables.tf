variable "aws_profile" {
  type    = string
  default = "terraform"
}

variable "environment" {
  type        = string
  description = "デプロイ環境（dev / stg / prod）"
  default     = "dev"

  validation {
    condition     = contains(["dev", "stg", "prod"], var.environment)
    error_message = "environment は dev / stg / prod のいずれかを指定してください。"
  }
}

variable "alert_email" {
  type        = string
  description = "予算オーバー通知先メールアドレス（terraform.tfvars または TF_VAR_alert_email で指定）"
}

variable "allowed_origins" {
  type        = list(string)
  description = "CORS許可オリジン（本番環境ではフロントエンドのドメインを指定）"
  default     = ["*"]
}

variable "budget_threshold" {
  type        = number
  description = "予算オーバーとみなす支出額（円）"
  default     = 100000
}
