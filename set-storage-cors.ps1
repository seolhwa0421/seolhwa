param(
    [string]$BucketName = 'seolhwadev.firebasestorage.app',
    [string]$CorsFile = '.\\firebase-storage-cors.json'
)

$ErrorActionPreference = 'Stop'

$resolvedCorsFile = Resolve-Path -Path $CorsFile

if (-not $resolvedCorsFile) {
    throw "CORS 설정 파일을 찾을 수 없습니다: $CorsFile"
}

$resolvedCorsFile = $resolvedCorsFile.Path
$bucketUri = if ($BucketName.StartsWith('gs://')) { $BucketName } else { "gs://$BucketName" }

Write-Host "적용 대상 버킷: $BucketName"
Write-Host "CORS 설정 파일: $resolvedCorsFile"

if (Get-Command gcloud -ErrorAction SilentlyContinue) {
    Write-Host 'gcloud storage로 Firebase Storage CORS 설정을 적용합니다.'
    gcloud storage buckets update $bucketUri --cors-file=$resolvedCorsFile
    Write-Host '적용된 CORS 설정을 다시 확인합니다.'
    gcloud storage buckets describe $bucketUri --format="json(cors_config)"
    exit 0
}

if (Get-Command gsutil -ErrorAction SilentlyContinue) {
    Write-Host 'gsutil로 Firebase Storage CORS 설정을 적용합니다.'
    & gsutil cors set $resolvedCorsFile $bucketUri
    Write-Host '적용된 CORS 설정을 다시 확인합니다.'
    & gsutil cors get $bucketUri
    exit 0
}

throw 'gsutil 또는 gcloud CLI가 필요합니다. Google Cloud SDK를 설치한 뒤 다시 실행하세요.'