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
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
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
