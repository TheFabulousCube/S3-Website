# S3 Website Journey

This repository is my working portfolio project for learning how to host and
operate a static website on AWS with real production-style pieces around it.

The site itself is intentionally simple: static HTML, CSS, and JavaScript. The
interesting part is the infrastructure journey around it: moving from manual S3
syncs toward a repeatable deployment pipeline, HTTPS through CloudFront, and a
small serverless contact form.

## What This Project Covers

- Hosting a static website from S3.
- Putting CloudFront in front of the site for HTTPS and caching.
- Using Terraform to describe AWS infrastructure instead of configuring it only
  through the console.
- Importing existing AWS resources into Terraform state without breaking the
  live site.
- Separating public static assets from generated deployment config.
- Building a contact form with API Gateway, Lambda, and SES.
- Moving toward GitHub Actions deployment with AWS OIDC instead of long-lived
  AWS keys.

## What I Am Learning

This repo captures the practical, slightly messy middle of infrastructure work:

- Terraform state and provider locks are different things.
- Existing cloud resources rarely match the first draft of Terraform.
- DNS ownership matters; CloudFront can use alternate names even when DNS is
  managed outside Route 53.
- Console edits create drift, and drift needs to be folded back into code.
- Public API keys in browser JavaScript are not secrets.
- The safest migration path is small imports, frequent plans, and no surprise
  applies.

## Repository Layout

- `website/` - static site files.
- `infra/bootstrap/` - Terraform bootstrap for remote state and GitHub OIDC.
- `infra/site/` - Terraform for the site hosting and contact backend.
- `lambda/contact/` - contact form Lambda source.
- `scripts/` - deployment/config helper scripts.
- `.github/workflows/` - CI and deployment workflow drafts.

Operational runbooks, import notes, and account-specific deployment details are
kept out of the public repo.

## Status

This is an active learning project. The website exists, the Terraform structure
is taking shape, and existing AWS resources are being imported gradually so the
live site can be managed safely.
