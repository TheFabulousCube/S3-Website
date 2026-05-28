terraform {
  required_version = ">= 1.6.0"

  backend "s3" {}

  required_providers {
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }

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

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "S3-Website"
      ManagedBy   = "Terraform"
      Repository  = "TheFabulousCube/S3-Website"
      Environment = "prod"
    }
  }
}
