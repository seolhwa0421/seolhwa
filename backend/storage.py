"""Oracle Cloud Object Storage 클라이언트"""

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import logging
from config import settings

logger = logging.getLogger(__name__)


class OracleStorageClient:
    """Oracle Cloud Object Storage 상호작용 클라이언트"""
    
    def __init__(self):
        """S3 호환 API를 사용하여 Oracle Cloud Object Storage에 연결"""
        try:
            # boto3 S3 클라이언트 초기화 (S3 호환 API)
            self.s3_client = boto3.client(
                "s3",
                region_name=settings.ORACLE_REGION,
                endpoint_url=settings.ORACLE_ENDPOINT_URL,
                aws_access_key_id=settings.ORACLE_ACCESS_KEY,
                aws_secret_access_key=settings.ORACLE_SECRET_KEY,
                config=Config(
                    signature_version="s3v4",
                    retries={"max_attempts": 3, "mode": "adaptive"},
                )
            )
            logger.info("✅ Oracle Cloud Object Storage 클라이언트 초기화 완료")
        except Exception as e:
            logger.error(f"❌ Oracle Cloud Object Storage 연결 실패: {str(e)}")
            raise
    
    def upload_file(
        self,
        file_content: bytes,
        file_name: str,
        content_type: str = "application/octet-stream",
        folder_prefix: str = ""
    ) -> dict:
        """
        파일을 Oracle Cloud Object Storage에 업로드
        
        Args:
            file_content: 파일 바이너리 데이터
            file_name: 저장할 파일명 (UUID 포함)
            content_type: MIME 타입
            folder_prefix: 폴더 경로 (예: "archive/", "images/")
        
        Returns:
            {
                "success": bool,
                "file_name": str,
                "public_url": str,
                "error": str (실패 시)
            }
        """
        try:
            # 폴더 경로가 있으면 추가
            object_key = f"{folder_prefix}{file_name}" if folder_prefix else file_name
            
            # Oracle Cloud에 파일 업로드
            self.s3_client.put_object(
                Bucket=settings.ORACLE_BUCKET_NAME,
                Key=object_key,
                Body=file_content,
                ContentType=content_type,
                Metadata={
                    "uploaded-by": "seolhwa-archive-api",
                }
            )
            
            # 퍼블릭 URL 생성 (Oracle Cloud Object Storage 형식)
            public_url = self._generate_public_url(object_key)
            
            logger.info(f"✅ 파일 업로드 성공: {object_key}")
            
            return {
                "success": True,
                "file_name": object_key,
                "public_url": public_url,
            }
        
        except ClientError as e:
            error_message = f"S3 업로드 오류: {str(e)}"
            logger.error(f"❌ {error_message}")
            return {
                "success": False,
                "file_name": file_name,
                "error": error_message,
            }
        except Exception as e:
            error_message = f"파일 업로드 중 오류: {str(e)}"
            logger.error(f"❌ {error_message}")
            return {
                "success": False,
                "file_name": file_name,
                "error": error_message,
            }
    
    def delete_file(self, file_key: str) -> dict:
        """
        Oracle Cloud Object Storage에서 파일 삭제
        
        Args:
            file_key: 삭제할 객체의 키
        
        Returns:
            {"success": bool, "error": str (실패 시)}
        """
        try:
            self.s3_client.delete_object(
                Bucket=settings.ORACLE_BUCKET_NAME,
                Key=file_key
            )
            logger.info(f"✅ 파일 삭제 성공: {file_key}")
            return {"success": True}
        
        except ClientError as e:
            error_message = f"S3 삭제 오류: {str(e)}"
            logger.error(f"❌ {error_message}")
            return {"success": False, "error": error_message}
        except Exception as e:
            error_message = f"파일 삭제 중 오류: {str(e)}"
            logger.error(f"❌ {error_message}")
            return {"success": False, "error": error_message}
    
    def get_file(self, file_key: str) -> dict:
        """
        Oracle Cloud Object Storage에서 파일 다운로드
        
        Args:
            file_key: 다운로드할 객체의 키
        
        Returns:
            {"success": bool, "content": bytes, "error": str (실패 시)}
        """
        try:
            response = self.s3_client.get_object(
                Bucket=settings.ORACLE_BUCKET_NAME,
                Key=file_key
            )
            content = response["Body"].read()
            logger.info(f"✅ 파일 다운로드 성공: {file_key}")
            return {
                "success": True,
                "content": content,
            }
        
        except ClientError as e:
            error_message = f"S3 다운로드 오류: {str(e)}"
            logger.error(f"❌ {error_message}")
            return {"success": False, "error": error_message}
        except Exception as e:
            error_message = f"파일 다운로드 중 오류: {str(e)}"
            logger.error(f"❌ {error_message}")
            return {"success": False, "error": error_message}
    
    def list_files(self, prefix: str = "") -> dict:
        """
        Oracle Cloud Object Storage의 파일 목록 조회
        
        Args:
            prefix: 조회할 폴더 경로
        
        Returns:
            {"success": bool, "files": list, "error": str (실패 시)}
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=settings.ORACLE_BUCKET_NAME,
                Prefix=prefix
            )
            
            files = []
            if "Contents" in response:
                files = [
                    {
                        "key": obj["Key"],
                        "size": obj["Size"],
                        "last_modified": obj["LastModified"].isoformat(),
                    }
                    for obj in response["Contents"]
                ]
            
            logger.info(f"✅ 파일 목록 조회 성공: {len(files)}개")
            return {
                "success": True,
                "files": files,
            }
        
        except ClientError as e:
            error_message = f"S3 목록 조회 오류: {str(e)}"
            logger.error(f"❌ {error_message}")
            return {"success": False, "error": error_message}
        except Exception as e:
            error_message = f"파일 목록 조회 중 오류: {str(e)}"
            logger.error(f"❌ {error_message}")
            return {"success": False, "error": error_message}
    
    def _generate_public_url(self, object_key: str) -> str:
        """
        Oracle Cloud Object Storage 퍼블릭 URL 생성
        
        형식: https://{namespace}.compat.objectstorage.{region}.oraclecloud.com/n/{namespace}/b/{bucket}/o/{object_key}
        """
        public_url = (
            f"{settings.ORACLE_ENDPOINT_URL}/n/{settings.ORACLE_NAMESPACE}"
            f"/b/{settings.ORACLE_BUCKET_NAME}/o/{object_key}"
        )
        return public_url
    
    def validate_connection(self) -> bool:
        """Oracle Cloud Object Storage 연결 테스트"""
        try:
            self.s3_client.head_bucket(Bucket=settings.ORACLE_BUCKET_NAME)
            logger.info("✅ Oracle Cloud Object Storage 연결 확인 완료")
            return True
        except ClientError as e:
            logger.error(f"❌ Oracle Cloud 연결 실패: {str(e)}")
            return False


# 전역 클라이언트 인스턴스
storage_client = None


def get_storage_client() -> OracleStorageClient:
    """저장소 클라이언트 싱글톤 반환"""
    global storage_client
    if storage_client is None:
        storage_client = OracleStorageClient()
    return storage_client
