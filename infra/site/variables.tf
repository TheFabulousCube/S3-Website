variable "aws_region" {
  description = "Primary AWS region."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short project name used for resource naming."
  type        = string
  default     = "fabulous-cube"
}

variable "site_bucket_name" {
  description = "S3 bucket containing the static website."
  type        = string
  default     = "the-fabulous-cube"
}

variable "root_domain" {
  description = "Route53 hosted zone domain."
  type        = string
  default     = "thefabulouscube.com"
}

variable "site_domain" {
  description = "Public CloudFront alias for the site."
  type        = string
  default     = "s3-hosted.thefabulouscube.com"
}

variable "contact_to_email" {
  description = "Verified recipient email for contact form messages."
  type        = string
  sensitive   = true
}

variable "contact_from_email" {
  description = "Verified SES sender email for contact form messages."
  type        = string
  sensitive   = true
}

variable "contact_email_subject_prefix" {
  description = "Subject prefix for contact form emails."
  type        = string
  default     = "Website contact"
}

variable "contact_api_key_enabled" {
  description = "Whether API Gateway should require a browser-visible API key."
  type        = bool
  default     = false
}
