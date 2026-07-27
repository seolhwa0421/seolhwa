"""Oracle Cloud Object Storage 연동 설정"""

import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()


class Settings:
    """애플리케이션 설정"""
    
    # Oracle Cloud 설정
    ORACLE_ACCESS_KEY: str = os.getenv("ORACLE_ACCESS_KEY", "")
    ORACLE_SECRET_KEY: str = os.getenv("ORACLE_SECRET_KEY", "")
    ORACLE_ENDPOINT_URL: str = os.getenv("ORACLE_ENDPOINT_URL", "")
    ORACLE_BUCKET_NAME: str = os.getenv("ORACLE_BUCKET_NAME", "")
    ORACLE_NAMESPACE: str = os.getenv("ORACLE_NAMESPACE", "")
    ORACLE_REGION: str = os.getenv("ORACLE_REGION", "")
    
    # FastAPI 설정
    FASTAPI_HOST: str = os.getenv("FASTAPI_HOST", "0.0.0.0")
    FASTAPI_PORT: int = int(os.getenv("FASTAPI_PORT", "8000"))
    FASTAPI_ENV: str = os.getenv("FASTAPI_ENV", "development")
    
    # CORS 설정
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # 파일 업로드 설정
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_EXTENSIONS: set = {
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
        "txt", "csv", "json", "zip", "rar",
        "jpg", "jpeg", "png", "gif", "bmp", "webp",
        "mp4", "avi", "mov", "mkv", "flv",
        "mp3", "wav", "aac", "flac"
    }
    
    def validate_config(self) -> bool:
        """필수 설정값이 모두 입력되었는지 확인"""
        required_fields = [
            "ORACLE_ACCESS_KEY",
            "ORACLE_SECRET_KEY",
            "ORACLE_ENDPOINT_URL",
            "ORACLE_BUCKET_NAME",
            "ORACLE_NAMESPACE",
            "ORACLE_REGION"
        ]
        
        for field in required_fields:
            if not getattr(self, field):
                print(f"⚠️  필수 설정값 누락: {field}")
                return False
        
        return True


settings = Settings()
