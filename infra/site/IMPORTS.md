# Import Existing AWS Resources

Use these commands after `terraform init` with the remote backend configured.
Replace placeholder IDs with values from AWS.

```bash
terraform import aws_s3_bucket.site the-fabulous-cube
terraform import aws_s3_bucket_public_access_block.site the-fabulous-cube
terraform import aws_s3_bucket_ownership_controls.site the-fabulous-cube
terraform import aws_s3_bucket_versioning.site the-fabulous-cube
terraform import aws_s3_bucket_server_side_encryption_configuration.site the-fabulous-cube

terraform import aws_cloudfront_distribution.site DISTRIBUTION_ID
terraform import aws_cloudfront_origin_access_control.site OAC_ID
terraform import aws_cloudfront_function.site_uri_rewrite fabulous-cube-uri-rewrite

terraform import aws_acm_certificate.site ACM_CERTIFICATE_ARN
terraform import aws_route53_record.site HOSTED_ZONE_ID_s3-hosted.thefabulouscube.com_A

terraform import aws_lambda_function.contact fabulous-cube-contact
terraform import aws_iam_role.contact_lambda fabulous-cube-contact-lambda
terraform import aws_cloudwatch_log_group.contact_lambda /aws/lambda/fabulous-cube-contact

terraform import aws_api_gateway_rest_api.contact REST_API_ID
terraform import aws_api_gateway_resource.contact REST_API_ID/RESOURCE_ID
terraform import aws_api_gateway_stage.contact REST_API_ID/prod
```

After importing, run:

```bash
terraform plan
```

Adjust names or variables until Terraform plans no unexpected replacements.
The current browser API key should be treated as public; prefer disabling API key
requirements and relying on API Gateway/Lambda throttling unless you need the key
for compatibility during migration.
