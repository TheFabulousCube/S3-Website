resource "aws_cloudwatch_log_group" "contact_lambda" {
  name              = "/aws/lambda/tfc-sample-contact-handler"
  retention_in_days = 30
}

resource "aws_lambda_function" "contact" {
  # function_name    = "${var.project_name}-contact"
  function_name    = "tfc-sample-contact-handler"
  role             = aws_iam_role.contact_lambda.arn
  handler          = "app.lambda_handler"
  runtime          = "python3.12"
  filename         = data.archive_file.contact_lambda.output_path
  source_code_hash = data.archive_file.contact_lambda.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      ALLOWED_ORIGINS              = join(",", local.site_origins)
      CONTACT_EMAIL_SUBJECT_PREFIX = var.contact_email_subject_prefix
      CONTACT_FROM_EMAIL           = var.contact_from_email
      CONTACT_TO_EMAIL             = var.contact_to_email
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.contact_lambda,
    aws_iam_role_policy_attachment.contact_lambda_basic,
    aws_iam_role_policy.contact_lambda_ses,
  ]
}
