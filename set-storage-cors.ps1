param(
    [string]$BucketName = 'seolhwadev.firebasestorage.app',
    [string]$CorsFile = '.\\firebase-storage-cors.json'
)

$ErrorActionPreference = 'Stop'

function Get-PreferredCliCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Names
    )

    foreach ($name in $Names) {
        $command = Get-Command $name -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($command) {
            return $command.Source
        }
    }

    return $null
}

$resolvedCorsFile = Resolve-Path -Path $CorsFile

if (-not $resolvedCorsFile) {
    throw "CORS 설정 파일을 찾을 수 없습니다: $CorsFile"
}

$resolvedCorsFile = $resolvedCorsFile.Path
$bucketUri = if ($BucketName.StartsWith('gs://')) { $BucketName } else { "gs://$BucketName" }

Write-Host "적용 대상 버킷: $BucketName"
Write-Host "CORS 설정 파일: $resolvedCorsFile"

$gcloudCommand = Get-PreferredCliCommand -Names @('gcloud.cmd', 'gcloud')
if ($gcloudCommand) {
    Write-Host 'gcloud storage로 Firebase Storage CORS 설정을 적용합니다.'
    & $gcloudCommand storage buckets update $bucketUri --cors-file=$resolvedCorsFile
    Write-Host '적용된 CORS 설정을 다시 확인합니다.'
    & $gcloudCommand storage buckets describe $bucketUri --format="json(cors_config)"
    exit 0
}

$gsutilCommand = Get-PreferredCliCommand -Names @('gsutil.cmd', 'gsutil')
if ($gsutilCommand) {
    Write-Host 'gsutil로 Firebase Storage CORS 설정을 적용합니다.'
    & $gsutilCommand cors set $resolvedCorsFile $bucketUri
    Write-Host '적용된 CORS 설정을 다시 확인합니다.'
    & $gsutilCommand cors get $bucketUri
    exit 0
}

throw 'gsutil 또는 gcloud CLI가 필요합니다. Windows PowerShell에서는 gcloud.cmd 또는 gsutil.cmd가 우선 사용됩니다. 버킷이 404면 Firebase Console에서 실제 Storage 버킷 이름을 먼저 확인하세요.'