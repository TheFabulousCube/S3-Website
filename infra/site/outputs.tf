output "site_bucket_name" {
  value = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.site.domain_name
}

output "site_url" {
  value = "https://${var.site_domain}"
}

output "contact_api_endpoint" {
  value = "${aws_api_gateway_stage.contact.invoke_url}/contact"
}

output "contact_api_key_value" {
  value     = try(aws_api_gateway_api_key.contact[0].value, "")
  sensitive = true
}
