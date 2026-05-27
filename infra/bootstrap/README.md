# Bootstrap Terraform

This stack creates the remote Terraform state bucket, DynamoDB lock table, and
GitHub Actions OIDC role.

Run once with local AWS credentials:

```bash
terraform init
terraform apply -var-file=terraform.tfvars
```

After it completes, add these GitHub repository settings:

- `AWS_GITHUB_ACTIONS_ROLE_ARN` secret from `github_actions_role_arn`
- `TF_STATE_BUCKET` variable from `terraform_state_bucket`
- `TF_LOCK_TABLE` variable from `terraform_lock_table`
- `AWS_REGION` variable, usually `us-east-1`

The role starts with broad permissions so imports and first adoption are not
blocked. Tighten it after the imported infrastructure stabilizes.
