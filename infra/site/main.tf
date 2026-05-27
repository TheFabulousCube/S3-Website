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

resource "aws_s3_bucket" "site" {
  bucket = var.site_bucket_name
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.project_name}-site-oac"
  description                       = "OAC for ${var.site_bucket_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "site_uri_rewrite" {
  name    = "${var.project_name}-uri-rewrite"
  runtime = "cloudfront-js-1.0"
  comment = "Map extensionless paths to index documents."
  publish = true
  code    = <<-EOT
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith("/")) {
    request.uri = uri + "index.html";
  } else if (uri.indexOf(".") === -1) {
    request.uri = uri + "/index.html";
  }

  return request;
}
EOT
}

resource "aws_acm_certificate" "site" {
  provider          = aws.us_east_1
  domain_name       = var.site_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "site_certificate_validation" {
  for_each = {
    for option in aws_acm_certificate.site.domain_validation_options :
    option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  }

  zone_id = data.aws_route53_zone.site.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "site" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in aws_route53_record.site_certificate_validation : record.fqdn]
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = var.site_domain
  default_root_object = "index.html"
  aliases             = [var.site_domain]

  origin {
    origin_id                = "s3-site"
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.site_uri_rewrite.arn
    }
  }

  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/error.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/error.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

data "aws_iam_policy_document" "site_bucket" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_bucket.json
}

resource "aws_route53_record" "site" {
  zone_id = data.aws_route53_zone.site.zone_id
  name    = var.site_domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_iam_role" "contact_lambda" {
  name = "${var.project_name}-contact-lambda"

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

resource "aws_iam_role_policy_attachment" "contact_lambda_basic" {
  role       = aws_iam_role.contact_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "contact_lambda_ses" {
  name = "${var.project_name}-contact-ses"
  role = aws_iam_role.contact_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "contact_lambda" {
  name              = "/aws/lambda/${var.project_name}-contact"
  retention_in_days = 30
}

resource "aws_lambda_function" "contact" {
  function_name    = "${var.project_name}-contact"
  role             = aws_iam_role.contact_lambda.arn
  handler          = "app.handler"
  runtime          = "python3.12"
  filename         = data.archive_file.contact_lambda.output_path
  source_code_hash = data.archive_file.contact_lambda.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      ALLOWED_ORIGINS              = "https://${var.site_domain}"
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

resource "aws_api_gateway_rest_api" "contact" {
  name = "${var.project_name}-contact"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "contact" {
  rest_api_id = aws_api_gateway_rest_api.contact.id
  parent_id   = aws_api_gateway_rest_api.contact.root_resource_id
  path_part   = "contact"
}

resource "aws_api_gateway_method" "contact_post" {
  rest_api_id      = aws_api_gateway_rest_api.contact.id
  resource_id      = aws_api_gateway_resource.contact.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = var.contact_api_key_enabled
}

resource "aws_api_gateway_integration" "contact_post" {
  rest_api_id             = aws_api_gateway_rest_api.contact.id
  resource_id             = aws_api_gateway_resource.contact.id
  http_method             = aws_api_gateway_method.contact_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.contact.invoke_arn
}

resource "aws_api_gateway_method" "contact_options" {
  rest_api_id   = aws_api_gateway_rest_api.contact.id
  resource_id   = aws_api_gateway_resource.contact.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "contact_options" {
  rest_api_id = aws_api_gateway_rest_api.contact.id
  resource_id = aws_api_gateway_resource.contact.id
  http_method = aws_api_gateway_method.contact_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 204}"
  }
}

resource "aws_api_gateway_method_response" "contact_options" {
  rest_api_id = aws_api_gateway_rest_api.contact.id
  resource_id = aws_api_gateway_resource.contact.id
  http_method = aws_api_gateway_method.contact_options.http_method
  status_code = "204"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "contact_options" {
  rest_api_id = aws_api_gateway_rest_api.contact.id
  resource_id = aws_api_gateway_resource.contact.id
  http_method = aws_api_gateway_method.contact_options.http_method
  status_code = aws_api_gateway_method_response.contact_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Api-Key'"
    "method.response.header.Access-Control-Allow-Methods" = "'OPTIONS,POST'"
    "method.response.header.Access-Control-Allow-Origin"  = "'https://${var.site_domain}'"
  }
}

resource "aws_lambda_permission" "contact_api" {
  statement_id  = "AllowExecutionFromApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.contact.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.contact.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "contact" {
  rest_api_id = aws_api_gateway_rest_api.contact.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.contact.id,
      aws_api_gateway_method.contact_post.id,
      aws_api_gateway_integration.contact_post.id,
      aws_api_gateway_method.contact_options.id,
      aws_api_gateway_integration.contact_options.id,
      aws_api_gateway_integration_response.contact_options.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "contact" {
  rest_api_id   = aws_api_gateway_rest_api.contact.id
  deployment_id = aws_api_gateway_deployment.contact.id
  stage_name    = "prod"
}

resource "aws_api_gateway_method_settings" "contact" {
  rest_api_id = aws_api_gateway_rest_api.contact.id
  stage_name  = aws_api_gateway_stage.contact.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    throttling_burst_limit = 5
    throttling_rate_limit  = 1
  }
}

resource "aws_api_gateway_api_key" "contact" {
  count   = var.contact_api_key_enabled ? 1 : 0
  name    = "${var.project_name}-contact-public"
  enabled = true
}

resource "aws_api_gateway_usage_plan" "contact" {
  count = var.contact_api_key_enabled ? 1 : 0
  name  = "${var.project_name}-contact"

  api_stages {
    api_id = aws_api_gateway_rest_api.contact.id
    stage  = aws_api_gateway_stage.contact.stage_name
  }

  throttle_settings {
    burst_limit = 5
    rate_limit  = 1
  }
}

resource "aws_api_gateway_usage_plan_key" "contact" {
  count         = var.contact_api_key_enabled ? 1 : 0
  key_id        = aws_api_gateway_api_key.contact[0].id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.contact[0].id
}
