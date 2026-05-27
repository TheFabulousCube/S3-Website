#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $0 --bucket BUCKET --distribution-id DISTRIBUTION_ID

Uploads website/ to S3 with deterministic cache headers and invalidates CloudFront.
EOF
}

BUCKET=""
DISTRIBUTION_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket) BUCKET="$2"; shift 2 ;;
    --distribution-id) DISTRIBUTION_ID="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$BUCKET" || -z "$DISTRIBUTION_ID" ]]; then
  usage >&2
  exit 2
fi

DEST="s3://${BUCKET}"

aws s3 sync website "$DEST" \
  --delete \
  --cache-control "no-cache, no-store, must-revalidate"

aws s3 sync website/scripts "$DEST/scripts" \
  --delete \
  --cache-control "public, max-age=300"

aws s3 sync website/styles "$DEST/styles" \
  --delete \
  --cache-control "public, max-age=300"

aws s3 sync website/images "$DEST/images" \
  --delete \
  --cache-control "public, max-age=86400"

aws s3 sync website/fonts "$DEST/fonts" \
  --delete \
  --cache-control "public, max-age=86400"

aws s3 cp website/config/contact.json "$DEST/config/contact.json" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "application/json"

aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"
