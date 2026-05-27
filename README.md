# The Fabulous Cube Website

Static website, contact form backend, and AWS infrastructure for
`s3-hosted.thefabulouscube.com`.

## Repository Layout

- `website/` - static website assets served by CloudFront/S3.
- `lambda/contact/` - Python Lambda used by the contact form.
- `infra/bootstrap/` - one-time Terraform stack for remote state and GitHub OIDC.
- `infra/site/` - Terraform stack for S3, CloudFront, ACM, Route53, API Gateway, Lambda, IAM, and logs.
- `scripts/` - deployment helpers used locally and by GitHub Actions.
- `.github/workflows/` - CI and deploy automation.

## One-Time Setup

Initialize Git locally:

```powershell
git init
git add .
git commit -m "Initial website infrastructure"
git branch -M main
git remote add origin https://github.com/TheFabulousCube/the-fabulous-cube-site.git
git push -u origin main
```

Create `infra/bootstrap/terraform.tfvars` from the example, then run:

```powershell
cd infra/bootstrap
terraform init
terraform apply -var-file=terraform.tfvars
```

Add the bootstrap outputs to GitHub repository settings:

- Secret `AWS_GITHUB_ACTIONS_ROLE_ARN`
- Variable `TF_STATE_BUCKET`
- Variable `TF_LOCK_TABLE`
- Variable `AWS_REGION`, usually `us-east-1`

Add contact email secrets:

- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`

Both SES email identities must be verified in AWS before production contact form
submissions can succeed.

## Adopt Existing AWS Resources

Create `infra/site/terraform.tfvars` from the example and fill in the live
values. Then initialize the remote backend:

```powershell
cd infra/site
terraform init `
  -backend-config="bucket=<TF_STATE_BUCKET>" `
  -backend-config="key=site/terraform.tfstate" `
  -backend-config="region=us-east-1" `
  -backend-config="dynamodb_table=<TF_LOCK_TABLE>"
```

Follow `infra/site/IMPORTS.md` to import the existing S3, CloudFront, Route53,
ACM, API Gateway, Lambda, IAM, and CloudWatch resources.

Run `terraform plan` repeatedly and adjust Terraform or variables until there
are no unexpected replacements.

## Contact Form Config

The browser no longer contains hardcoded API Gateway values. Deployment writes:

```text
website/config/contact.json
```

from Terraform outputs. The file is intentionally ignored by Git. For local
shape/reference, see:

```text
website/config/contact.example.json
```

## Deploy

Merging to `main` runs `.github/workflows/deploy.yml`:

1. Applies `infra/site` Terraform.
2. Generates `website/config/contact.json`.
3. Uploads `website/` to S3 with cache headers.
4. Invalidates CloudFront.

For local deployment after Terraform is initialized:

```powershell
$env:CONTACT_API_ENDPOINT = terraform -chdir=infra/site output -raw contact_api_endpoint
$env:CONTACT_API_KEY = terraform -chdir=infra/site output -raw contact_api_key_value
node scripts/generate-contact-config.mjs website/config/contact.json

$bucket = terraform -chdir=infra/site output -raw site_bucket_name
$distribution = terraform -chdir=infra/site output -raw cloudfront_distribution_id
bash scripts/deploy-site.sh --bucket $bucket --distribution-id $distribution
```

## Validation

```powershell
node --check website/scripts/contact.js
node --check scripts/generate-contact-config.mjs
python -m py_compile lambda/contact/app.py
terraform -chdir=infra/bootstrap fmt -check
terraform -chdir=infra/site fmt -check
```
