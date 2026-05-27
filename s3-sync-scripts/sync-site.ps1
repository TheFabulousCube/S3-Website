<#
.SYNOPSIS
  Sync an S3-hosted static website to a local directory using AWS CLI.

.DESCRIPTION
  A small helper that wraps `aws s3 sync` with common options: --dryrun, --delete,
  profile selection, includes/excludes and logging. Works on Windows PowerShell.

.PARAMETER Bucket
  The S3 bucket name (or s3://... path). Required.

.PARAMETER Destination
  Local directory to sync into. Defaults to the script directory (.)

.PARAMETER Profile
  AWS CLI profile to use. If omitted, default credentials are used.

.PARAMETER Delete
  When set, passes --delete to `aws s3 sync` (removes local files not in S3).

.PARAMETER DryRun
  When set, performs a dry-run (passes --dryrun to aws).

.PARAMETER LogFile
  Path to append logs to. Defaults to a `sync-site.log` next to the script.

.PARAMETER Exclude
  One or more --exclude patterns.

.PARAMETER Include
  One or more --include patterns.

.EXAMPLE
  .\sync-site.ps1 -Bucket my-website-bucket -Destination C:\sites\my-site -Profile work -Delete

#>

param(
    [Parameter(Mandatory=$true)][string]$Bucket,
    [string]$Destination = ".",
    [string]$Profile = $null,
    [switch]$Delete,
    [switch]$DryRun,
    [string]$LogFile = "$PSScriptRoot\sync-site.log",
    [string[]]$Exclude = @(),
    [string[]]$Include = @()
)

function Resolve-S3Path {
    param([string]$b)
    if ($b -match '^s3://') { return $b }
    return "s3://$b"
}

$ErrorActionPreference = 'Stop'

try {
    $s3Path = Resolve-S3Path -b $Bucket

    $awsArgs = @('s3','sync',$s3Path,$Destination)

    if ($Profile) { $awsArgs += @('--profile', $Profile) }
    if ($Delete)  { $awsArgs += '--delete' }
    if ($DryRun)  { $awsArgs += '--dryrun' }

    foreach ($e in $Exclude) { $awsArgs += @('--exclude', $e) }
    foreach ($i in $Include) { $awsArgs += @('--include', $i) }

    $timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    "`n[$timestamp] Starting aws s3 sync: $($awsArgs -join ' ')" | Tee-Object -FilePath $LogFile -Append

    # Run the aws CLI and tee output to console and logfile
    & aws @awsArgs 2>&1 | Tee-Object -FilePath $LogFile -Append

    $exit = $LASTEXITCODE
    "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] Finished with exit code $exit" | Tee-Object -FilePath $LogFile -Append

    exit $exit
}
catch {
    $msg = "Error: $($_.Exception.Message)"
    $msg | Tee-Object -FilePath $LogFile -Append
    Write-Error $msg
    exit 2
}
