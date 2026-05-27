variable "aws_region" {
  description = "AWS region for Terraform state and GitHub OIDC resources."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short project name used for resource naming."
  type        = string
  default     = "fabulous-cube"
}

variable "github_owner" {
  description = "GitHub org or username that owns the repository."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name."
  type        = string
}
