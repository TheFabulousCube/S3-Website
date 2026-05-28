terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "S3-Website"
      ManagedBy   = "Terraform"
      Repository  = "TheFabulousCube/S3-Website"
      Environment = "prod"
    }
  }
}
