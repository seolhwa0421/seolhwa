# Seolhwa Archive FastAPI 백엔드

Oracle Cloud Object Storage와 연동하는 파일 저장소 API

## 설치 및 실행

### 1. 패키지 설치

```bash
# Windows PowerShell에서 실행
pip install -r requirements.txt
```

또는 개별 설치:

```bash
pip install fastapi==0.104.1
pip install uvicorn==0.24.0
pip install boto3==1.28.85
pip install python-dotenv==1.0.0
pip install python-multipart==0.0.6
pip install pydantic==2.4.2
```

### 2. 환경변수 설정

`.env` 파일에 다음 정보를 입력:

```env
ORACLE_ACCESS_KEY=your_access_key
ORACLE_SECRET_KEY=your_secret_key
ORACLE_ENDPOINT_URL=https://namespace.compat.objectstorage.region.oraclecloud.com
ORACLE_BUCKET_NAME=your_bucket_name
ORACLE_NAMESPACE=your_namespace
ORACLE_REGION=your_region
```

### 3. 서버 실행

```bash
# 개발 모드 실행
python main.py

# 또는 uvicorn 직접 실행
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

서버가 시작되면 다음 URL에서 API 문서를 확인할 수 있습니다:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 엔드포인트

### 헬스 체크

#### GET `/health`
서버 상태 확인
```bash
curl http://localhost:8000/health
```

#### GET `/health/storage`
Oracle Cloud Object Storage 연결 상태 확인
```bash
curl http://localhost:8000/health/storage
```

### 파일 업로드

#### POST `/api/v1/upload`
일반 파일 업로드 (UUID 자동 생성)

**요청:**
```bash
curl -X POST http://localhost:8000/api/v1/upload \
  -F "file=@/path/to/file.pdf" \
  -F "folder=archive"
```

**응답:**
```json
{
  "success": true,
  "file_name": "archive/550e8400-e29b-41d4-a716-446655440000_file.pdf",
  "public_url": "https://namespace.compat.objectstorage.region.oraclecloud.com/n/namespace/b/bucket/o/archive/550e8400-e29b-41d4-a716-446655440000_file.pdf"
}
```

#### POST `/api/v1/upload-image`
이미지 파일 업로드 (이미지 파일만)

**요청:**
```bash
curl -X POST http://localhost:8000/api/v1/upload-image \
  -F "file=@/path/to/image.jpg"
```

**응답:**
```json
{
  "success": true,
  "file_name": "images/550e8400-e29b-41d4-a716-446655440000_image.jpg",
  "public_url": "https://namespace.compat.objectstorage.region.oraclecloud.com/n/namespace/b/bucket/o/images/550e8400-e29b-41d4-a716-446655440000_image.jpg"
}
```

### 파일 조회

#### GET `/api/v1/files`
폴더의 파일 목록 조회

**요청:**
```bash
curl http://localhost:8000/api/v1/files?folder=archive
```

**응답:**
```json
{
  "success": true,
  "files": [
    {
      "key": "archive/550e8400-e29b-41d4-a716-446655440000_file.pdf",
      "size": 1024,
      "last_modified": "2024-01-20T10:30:00"
    }
  ]
}
```

### 파일 삭제

#### DELETE `/api/v1/files/{file_key}`
파일 삭제

**요청:**
```bash
curl -X DELETE http://localhost:8000/api/v1/files/archive/550e8400-e29b-41d4-a716-446655440000_file.pdf
```

**응답:**
```json
{
  "success": true
}
```

## 주요 기능

✅ **UUID 기반 파일명 관리**: 중복 파일명 자동 방지
✅ **S3 호환 API**: boto3를 통한 Oracle Cloud Object Storage 연동
✅ **환경변수 관리**: python-dotenv로 보안 설정
✅ **CORS 지원**: 프론트엔드와의 크로스 도메인 통신
✅ **파일 검증**: 크기 및 확장자 검증
✅ **상세한 로깅**: 모든 작업 기록
✅ **예외 처리**: 500 에러 포함 완벽한 에러 핸들링
✅ **퍼블릭 URL**: 외부에서 직접 접근 가능한 URL 반환

## 지원하는 파일 확장자

- 문서: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, json, zip, rar
- 이미지: jpg, jpeg, png, gif, bmp, webp
- 동영상: mp4, avi, mov, mkv, flv
- 오디오: mp3, wav, aac, flac

## 에러 처리

서버는 다음의 HTTP 상태 코드를 반환합니다:

- `200`: 성공
- `400`: 잘못된 요청 (파일 형식 오류 등)
- `413`: 파일이 너무 큼
- `500`: 서버 오류

모든 에러 응답은 다음 형식으로 반환됩니다:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

## 프론트엔드 통합 예제

### JavaScript/Fetch API

```javascript
async function uploadFile(file, folder = 'archive') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  
  try {
    const response = await fetch('http://localhost:8000/api/v1/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('업로드 성공:', data.public_url);
      return data;
    } else {
      console.error('업로드 실패:', data.error);
    }
  } catch (error) {
    console.error('요청 오류:', error);
  }
}

// 사용 예제
const input = document.getElementById('file-input');
input.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const result = await uploadFile(file);
  }
});
```

## 설정 최적화

### 메모리 사용 최소화

대용량 파일 업로드 시 스트리밍 처리 권장:

```python
# main.py에서 수정 가능
MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100MB
```

### 성능 향상

boto3 재시도 정책 설정:

```python
# storage.py의 OracleStorageClient 초기화 부분
config=Config(
    signature_version="s3v4",
    retries={"max_attempts": 3, "mode": "adaptive"},
    connect_timeout=5,
    read_timeout=60
)
```

## 문제 해결

### Oracle Cloud 연결 오류

1. 환경변수 확인: `.env` 파일의 ACCESS_KEY, SECRET_KEY, ENDPOINT_URL 확인
2. 네트워크 연결 확인: `ping` 명령으로 엔드포인트 접근성 확인
3. 버킷 권한 확인: Oracle Cloud Console에서 IAM 정책 확인

### 파일 업로드 실패

1. 파일 크기 확인: `MAX_UPLOAD_SIZE` 초과 여부 확인
2. 파일 형식 확인: 허용되는 확장자인지 확인
3. 저장소 공간 확인: Oracle Cloud 저장소 용량 확인

### CORS 오류

프론트엔드 도메인을 `.env`의 `CORS_ORIGINS`에 추가

## 라이선스

MIT
