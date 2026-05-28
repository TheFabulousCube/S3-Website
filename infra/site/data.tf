data "aws_caller_identity" "current" {}

data "aws_route53_zone" "site" {
  name         = "${var.root_domain}."
  private_zone = false
}

data "archive_file" "contact_lambda" {
  type        = "zip"
  source_file = "${path.module}/../../lambda/contact/app.py"
  output_path = "${path.module}/../../lambda/contact/dist/contact.zip"
}
