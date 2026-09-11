from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AlwaysPDF Pro API"
    soffice_path: str = Field(default="soffice")
    gs_path: str = Field(default="gs")
    ocrmypdf_path: str = Field(default="ocrmypdf")
    adobe_pdf_services_client_id: str = Field(default="")
    adobe_pdf_services_client_secret: str = Field(default="")
    adobe_pdf_services_enabled: bool = Field(default=True)
    max_upload_mb: int = Field(default=50)
    conversion_timeout_seconds: int = Field(default=120)
    allowed_origins: str = Field(default="*")
    work_dir: Path = Field(default=Path("/tmp/alwayspdf-pro"))

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def cors_origins(self) -> list[str]:
        if self.allowed_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def adobe_pdf_services_available(self) -> bool:
        return (
            self.adobe_pdf_services_enabled
            and bool(self.adobe_pdf_services_client_id.strip())
            and bool(self.adobe_pdf_services_client_secret.strip())
        )

    class Config:
        env_file = ".env"
        env_prefix = "ALWAYSPDF_"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.work_dir.mkdir(parents=True, exist_ok=True)
    return settings
