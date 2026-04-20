variable "aws_profile" {
  type    = string
  default = "terraform"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "alert_email" {
  type        = string
  description = "予算オーバー通知先メールアドレス"
  default     = "majesty0107@icloud.com"
}

variable "budget_threshold" {
  type        = number
  description = "予算オーバーとみなす支出額（円）"
  default     = 100000
}
