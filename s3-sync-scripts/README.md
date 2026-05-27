# S3 Static Site Sync Scripts

This small collection contains two scripts to sync a static website hosted in an S3 bucket to a local directory using the AWS CLI.

Files

- `sync-site.ps1` - PowerShell script for Windows (supports profile, delete, dry-run, includes/excludes and logging).
- `sync-site.sh` - Portable bash script for Linux/macOS (same features).

Prerequisites

- AWS CLI v2 installed and configured (https://aws.amazon.com/cli/)
- Credentials available in `~/.aws/credentials` or environment, or use `--profile`.
- Network access to S3.

Basic usage

PowerShell example:

```powershell
.\sync-site.ps1 -Bucket my-website-bucket -Destination C:\sites\my-site -Profile work -Delete
```

Bash example:

```bash
./sync-site.sh --bucket my-website-bucket --dest ./site --profile work --delete
```

Dry-run

Always test with dry-run first:

PowerShell:

```powershell
.\sync-site.ps1 -Bucket my-website-bucket -Destination C:\sites\my-site -DryRun
```

Bash:

```bash
./sync-site.sh --bucket my-website-bucket --dest ./site --dry-run
```

Scheduling

- Windows: create a Task Scheduler job that runs `PowerShell.exe -File "C:\path\to\sync-site.ps1" -Bucket my-website-bucket -Destination C:\sites\my-site -Profile work`
- Linux/macOS: add a cron job that calls the bash script.

Security

Ensure least-privilege IAM credentials: user or role should only have `s3:GetObject`, `s3:ListBucket` and, if using `--delete`, `s3:DeleteObject` on the bucket.

Notes and troubleshooting

- If `aws` isn't in PATH, provide full path or ensure the environment used by your scheduler has the correct PATH and AWS credentials.
- Logs are appended to `sync-site.log` by default next to the script; customize via `--log` (bash) or `-LogFile` (PowerShell).

## Initial download (your bucket -> /website)

You said your objects come from `arn:aws:s3:::the-fabulous-cube` and you want them placed under `/website` locally. The ARN translates to the S3 path `s3://the-fabulous-cube`.

Important: `aws s3 sync` is recursive by default and will preserve the bucket's folder structure when downloading.

Bash / Linux example (download into `/website`):

```bash
# create destination (run as root if writing to /)
sudo mkdir -p /website
sudo chown $(id -u):$(id -g) /website

# run the provided script (or call aws directly)
/path/to/sync-site.sh --bucket the-fabulous-cube --dest /website --profile your-profile
# or directly:
aws s3 sync s3://the-fabulous-cube /website --profile your-profile
```

PowerShell / Windows example (download into `C:\website`):

```powershell
# create destination
New-Item -Path 'C:\website' -ItemType Directory -Force

# run the script
.\sync-site.ps1 -Bucket the-fabulous-cube -Destination 'C:\website' -Profile your-profile
# or directly:
aws s3 sync s3://the-fabulous-cube C:\website --profile your-profile
```

Dry-run first to verify what will change:

```bash
aws s3 sync s3://the-fabulous-cube /website --dryrun --profile your-profile
```

Notes

- If you use `/website` (root) on Linux, the sync must run with permissions to write there (sudo or run as root). Consider using a subdirectory under your user home if you want to avoid elevated privileges.
- If you run this from a scheduler, ensure the scheduler's environment has access to the AWS CLI and the appropriate credentials.
- If you need to delete local files that no longer exist in S3, add `--delete` (use with care).
