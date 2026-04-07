# Firebase Storage CORS 적용

브라우저에서 보이는 `Access-Control-Allow-Origin` 응답 헤더는 클라이언트 코드가 아니라 Firebase Storage 버킷 설정에서 내려와야 합니다.

이 프로젝트에서는 [firebase-storage-cors.json](firebase-storage-cors.json)을 버킷에 적용하면 `https://seolhwa.dev`에서 GIF와 큰 이미지 업로드의 preflight 요청이 통과할 수 있습니다.

## 빠른 적용

PowerShell에서 프로젝트 폴더로 이동한 뒤 아래를 실행합니다.

```powershell
.\set-storage-cors.ps1
```

버킷 이름이 다르면 직접 넘길 수 있습니다.

```powershell
.\set-storage-cors.ps1 -BucketName "your-bucket-name"
```

## 필요 조건

- Google Cloud SDK 설치
- `gsutil` 또는 `gcloud` 로그인 완료
- 해당 Storage 버킷에 대한 관리자 권한

## 적용 후 확인

1. 브라우저를 완전히 새로고침합니다.
2. GIF 업로드를 다시 시도합니다.
3. DevTools Network에서 `firebasestorage.googleapis.com` 요청의 응답 헤더에 origin 허용이 반영됐는지 확인합니다.

## 404가 나오면

`gcloud storage buckets update`에서 404가 나오면 CORS 이전에 버킷 이름 확인이 먼저 필요합니다.

확인할 것:

- Firebase Console의 Storage에서 실제 기본 버킷 이름이 무엇인지
- 현재 Google Cloud CLI 계정이 그 프로젝트의 Storage 버킷을 볼 권한이 있는지
- 프로젝트가 실제로 Storage를 초기화한 상태인지

## 참고

- 이 문제는 [index.js](index.js) 같은 프론트 코드만 바꿔서는 해결되지 않습니다.
- 현재 설정에는 배포 도메인과 로컬 개발 주소가 함께 들어 있습니다.