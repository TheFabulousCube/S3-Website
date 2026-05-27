# Site Terraform

This stack manages:

- S3 private website bucket
- CloudFront distribution and Origin Access Control
- CloudFront URI rewrite function for `/about` -> `/about/index.html`
- ACM certificate in `us-east-1`
- Route53 alias record
- Contact Lambda, IAM role, CloudWatch log group
- API Gateway REST API with CORS, throttling, optional API key, and Lambda proxy

Use `terraform.tfvars.example` as a starting point.

For an existing live site, import resources first using `IMPORTS.md`. Do not
apply until `terraform plan` shows no unexpected replacements.
