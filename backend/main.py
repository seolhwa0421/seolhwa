"""Seolhwa Archive FastAPI 백엔드"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging
import uuid
from pathlib import Path

from config import settings
from storage import get_storage_client, OracleStorageClient

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# FastAPI 앱 초기화
app = FastAPI(
    title="Seolhwa Archive API",
    description="Oracle Cloud Object Storage 연동 파일 저장소 API",
    version="1.0.0"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# 데이터 모델
# ============================================================================

class UploadResponse(BaseModel):
    """파일 업로드 응답"""
    success: bool
    file_name: str
    public_url: str = None
    error: str = None


class DeleteResponse(BaseModel):
    """파일 삭제 응답"""
    success: bool
    error: str = None


class ListResponse(BaseModel):
    """파일 목록 응답"""
    success: bool
    files: list = []
    error: str = None


# ============================================================================
# 헬스체크
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """서버 상태 체크"""
    return {
        "status": "ok",
        "message": "Seolhwa Archive API is running"
    }


@app.get("/health/storage", tags=["Health"])
async def storage_health_check(
    storage_client: OracleStorageClient = Depends(get_storage_client)
):
    """Oracle Cloud Object Storage 연결 상태 체크"""
    try:
        is_connected = storage_client.validate_connection()
        if is_connected:
            return {
                "status": "ok",
                "message": "Oracle Cloud Object Storage is connected",
                "bucket": settings.ORACLE_BUCKET_NAME
            }
        else:
            return {
                "status": "error",
                "message": "Failed to connect to Oracle Cloud Object Storage"
            }
    except Exception as e:
        logger.error(f"Storage health check failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Storage health check failed: {str(e)}"
        }


# ============================================================================
# 파일 업로드 엔드포인트
# ============================================================================

@app.post("/api/v1/upload", response_model=UploadResponse, tags=["Upload"])
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "archive",
    storage_client: OracleStorageClient = Depends(get_storage_client)
):
    """
    파일을 Oracle Cloud Object Storage에 업로드
    
    - **file**: 업로드할 파일
    - **folder**: 저장할 폴더 (기본값: "archive")
    
    Returns:
        - success: 업로드 성공 여부
        - file_name: 저장된 파일명 (UUID 포함)
        - public_url: 외부 접근 가능한 퍼블릭 URL
    """
    try:
        # 파일 크기 확인
        file_content = await file.read()
        if len(file_content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"파일이 너무 큽니다. 최대 {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
            )
        
        # 파일 확장자 확인
        file_extension = Path(file.filename).suffix.lstrip(".").lower()
        if file_extension not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"허용되지 않는 파일 형식: {file_extension}"
            )
        
        # UUID를 포함한 파일명 생성 (중복 방지)
        file_uuid = str(uuid.uuid4())
        new_filename = f"{file_uuid}_{file.filename}"
        
        # 폴더 경로 정규화
        folder_prefix = f"{folder.strip('/')}/" if folder else ""
        
        # Oracle Cloud Object Storage에 업로드
        result = storage_client.upload_file(
            file_content=file_content,
            file_name=new_filename,
            content_type=file.content_type or "application/octet-stream",
            folder_prefix=folder_prefix
        )
        
        if not result["success"]:
            logger.error(f"File upload failed: {result.get('error')}")
            raise HTTPException(
                status_code=502,
                detail=result.get("error", "파일 업로드 중 오류가 발생했습니다.")
            )
        
        logger.info(f"✅ File uploaded successfully: {result['file_name']}")
        
        return UploadResponse(
            success=True,
            file_name=result["file_name"],
            public_url=result["public_url"]
        )
    
    except HTTPException as e:
        logger.warning(f"⚠️  Upload validation error: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected upload error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="파일 업로드 중 오류가 발생했습니다."
        )


@app.post("/api/v1/upload-image", response_model=UploadResponse, tags=["Upload"])
async def upload_image(
    file: UploadFile = File(...),
    storage_client: OracleStorageClient = Depends(get_storage_client)
):
    """
    이미지 파일을 Oracle Cloud Object Storage에 업로드
    
    - **file**: 업로드할 이미지 파일
    
    Returns:
        - success: 업로드 성공 여부
        - file_name: 저장된 파일명 (UUID 포함)
        - public_url: 외부 접근 가능한 퍼블릭 URL
    """
    try:
        # 이미지 파일 확인
        if not file.content_type or "image" not in file.content_type:
            raise HTTPException(
                status_code=400,
                detail="이미지 파일만 업로드 가능합니다."
            )
        
        # 파일 크기 확인
        file_content = await file.read()
        max_image_size = 50 * 1024 * 1024  # 50MB
        if len(file_content) > max_image_size:
            raise HTTPException(
                status_code=413,
                detail=f"이미지 파일이 너무 큽니다. 최대 {max_image_size / 1024 / 1024}MB"
            )
        
        # UUID를 포함한 파일명 생성
        file_uuid = str(uuid.uuid4())
        new_filename = f"{file_uuid}_{file.filename}"
        
        # Oracle Cloud Object Storage에 업로드
        result = storage_client.upload_file(
            file_content=file_content,
            file_name=new_filename,
            content_type=file.content_type,
            folder_prefix="images/"
        )
        
        if not result["success"]:
            logger.error(f"Image upload failed: {result.get('error')}")
            raise HTTPException(
                status_code=502,
                detail=result.get("error", "이미지 업로드 중 오류가 발생했습니다.")
            )
        
        logger.info(f"✅ Image uploaded successfully: {result['file_name']}")
        
        return UploadResponse(
            success=True,
            file_name=result["file_name"],
            public_url=result["public_url"]
        )
    
    except HTTPException as e:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected image upload error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="이미지 업로드 중 오류가 발생했습니다."
        )


# ============================================================================
# 파일 삭제 엔드포인트
# ============================================================================

@app.delete("/api/v1/files/{file_key}", response_model=DeleteResponse, tags=["Files"])
async def delete_file(
    file_key: str,
    storage_client: OracleStorageClient = Depends(get_storage_client)
):
    """
    Oracle Cloud Object Storage에서 파일 삭제
    
    - **file_key**: 삭제할 파일의 키 (예: "archive/uuid_filename.ext")
    
    Returns:
        - success: 삭제 성공 여부
    """
    try:
        if not file_key or file_key.strip() == "":
            raise HTTPException(
                status_code=400,
                detail="파일 키를 지정해주세요."
            )
        
        result = storage_client.delete_file(file_key)
        
        if not result["success"]:
            logger.error(f"File deletion failed: {result.get('error')}")
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "파일 삭제 중 오류가 발생했습니다.")
            )
        
        logger.info(f"✅ File deleted successfully: {file_key}")
        
        return DeleteResponse(success=True)
    
    except HTTPException as e:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected deletion error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="파일 삭제 중 오류가 발생했습니다."
        )


# ============================================================================
# 파일 목록 조회 엔드포인트
# ============================================================================

@app.get("/api/v1/files", response_model=ListResponse, tags=["Files"])
async def list_files(
    folder: str = "archive",
    storage_client: OracleStorageClient = Depends(get_storage_client)
):
    """
    Oracle Cloud Object Storage의 파일 목록 조회
    
    - **folder**: 조회할 폴더 (기본값: "archive")
    
    Returns:
        - success: 조회 성공 여부
        - files: 파일 목록
    """
    try:
        folder_prefix = f"{folder.strip('/')}/" if folder else ""
        
        result = storage_client.list_files(prefix=folder_prefix)
        
        if not result["success"]:
            logger.error(f"File listing failed: {result.get('error')}")
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "파일 목록 조회 중 오류가 발생했습니다.")
            )
        
        logger.info(f"✅ Listed {len(result.get('files', []))} files")
        
        return ListResponse(
            success=True,
            files=result.get("files", [])
        )
    
    except HTTPException as e:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected listing error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="파일 목록 조회 중 오류가 발생했습니다."
        )


# ============================================================================
# 에러 핸들러
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP 예외 처리"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """일반 예외 처리"""
    logger.error(f"❌ Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "내부 서버 오류가 발생했습니다."
        }
    )


# ============================================================================
# 서버 시작 이벤트
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 실행"""
    logger.info("🚀 Seolhwa Archive API 시작...")
    
    # 설정값 검증
    if not settings.validate_config():
        logger.error("❌ 필수 환경변수가 설정되지 않았습니다.")
        raise RuntimeError("Configuration validation failed")
    
    # Oracle Cloud 연결 테스트
    try:
        storage_client = get_storage_client()
        if storage_client.validate_connection():
            logger.info("✅ Oracle Cloud Object Storage 연결 성공")
        else:
            logger.error("❌ Oracle Cloud Object Storage 연결 실패")
    except Exception as e:
        logger.error(f"❌ 시작 중 오류: {str(e)}")


@app.on_event("shutdown")
async def shutdown_event():
    """서버 종료 시 실행"""
    logger.info("🛑 Seolhwa Archive API 종료...")


# ============================================================================
# 루트 엔드포인트
# ============================================================================

@app.get("/", tags=["Root"])
async def root():
    """API 정보"""
    return {
        "name": "Seolhwa Archive API",
        "version": "1.0.0",
        "description": "Oracle Cloud Object Storage 연동 파일 저장소 API",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "health_storage": "/health/storage",
            "upload": "POST /api/v1/upload",
            "upload_image": "POST /api/v1/upload-image",
            "list_files": "GET /api/v1/files",
            "delete_file": "DELETE /api/v1/files/{file_key}"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host=settings.FASTAPI_HOST,
        port=settings.FASTAPI_PORT
    )
