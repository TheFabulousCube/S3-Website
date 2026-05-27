#!/usr/bin/env bash
# Portable script to sync S3 static site to local directory using aws cli
# Usage: sync-site.sh --bucket my-bucket --dest ./site [--profile default] [--delete] [--dry-run]

set -euo pipefail

usage(){
  cat <<EOF
Usage: $0 --bucket BUCKET [--dest DIR] [--profile NAME] [--delete] [--dry-run] [--log FILE] [--exclude PATTERN] [--include PATTERN]

Options:
  --bucket    S3 bucket name or s3:// path (required)
  --dest      Local destination directory (default: .)
  --profile   AWS CLI profile to use
  --delete    Pass --delete to aws s3 sync
  --dry-run   Pass --dryrun to aws s3 sync
  --log       Log file path (default: ./sync-site.log)
  --exclude   Repeatable. Add --exclude PATTERN
  --include   Repeatable. Add --include PATTERN
  -h|--help   Show this help
EOF
}

BUCKET=""
DEST="."
PROFILE=""
DELETE=false
DRYRUN=false
LOGFILE="./sync-site.log"
EXCLUDE=()
INCLUDE=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket) BUCKET="$2"; shift 2;;
    --dest) DEST="$2"; shift 2;;
    --profile) PROFILE="$2"; shift 2;;
    --delete) DELETE=true; shift;;
    --dry-run) DRYRUN=true; shift;;
    --log) LOGFILE="$2"; shift 2;;
    --exclude) EXCLUDE+=("$2"); shift 2;;
    --include) INCLUDE+=("$2"); shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

if [[ -z "$BUCKET" ]]; then
  echo "--bucket is required" >&2; usage; exit 2
fi

if [[ "$BUCKET" != s3://* ]]; then
  BUCKET="s3://$BUCKET"
fi

AWS_ARGS=(s3 sync "$BUCKET" "$DEST")
if [[ -n "$PROFILE" ]]; then AWS_ARGS+=(--profile "$PROFILE"); fi
if [[ "$DELETE" = true ]]; then AWS_ARGS+=(--delete); fi
if [[ "$DRYRUN" = true ]]; then AWS_ARGS+=(--dryrun); fi

for e in "${EXCLUDE[@]}"; do AWS_ARGS+=(--exclude "$e"); done
for i in "${INCLUDE[@]}"; do AWS_ARGS+=(--include "$i"); done

echo "$(date '+%Y-%m-%d %H:%M:%S') Starting: aws ${AWS_ARGS[*]}" | tee -a "$LOGFILE"

# Run, preserving exit code
set +e
aws ${AWS_ARGS[*]} 2>&1 | tee -a "$LOGFILE"
EXIT=$?
set -e

echo "$(date '+%Y-%m-%d %H:%M:%S') Finished with exit code $EXIT" | tee -a "$LOGFILE"
exit $EXIT
