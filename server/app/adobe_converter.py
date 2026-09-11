import os
import shutil
from pathlib import Path

from fastapi import HTTPException

from app.config import Settings


EXPORT_FORMATS = {
    "docx": "DOCX",
    "xlsx": "XLSX",
    "pptx": "PPTX",
}

CREATE_MEDIA_TYPES = {
    ".doc": "DOC",
    ".docx": "DOCX",
    ".xls": "XLS",
    ".xlsx": "XLSX",
    ".ppt": "PPT",
    ".pptx": "PPTX",
}


def _with_adobe_credentials(settings: Settings) -> None:
    os.environ["PDF_SERVICES_CLIENT_ID"] = settings.adobe_pdf_services_client_id
    os.environ["PDF_SERVICES_CLIENT_SECRET"] = settings.adobe_pdf_services_client_secret


def _pdf_services(settings: Settings):
    from adobe.pdfservices.operation.auth.service_principal_credentials import ServicePrincipalCredentials
    from adobe.pdfservices.operation.pdf_services import PDFServices

    _with_adobe_credentials(settings)
    credentials = ServicePrincipalCredentials(
        client_id=settings.adobe_pdf_services_client_id,
        client_secret=settings.adobe_pdf_services_client_secret,
    )
    return PDFServices(credentials=credentials)


def _write_stream_asset(stream_asset, output_path: Path) -> None:
    output_path.write_bytes(stream_asset.get_input_stream())


def run_adobe_pdf_export(
    input_path: Path,
    output_stem: str,
    settings: Settings,
    target_ext: str,
) -> tuple[Path, str]:
    target_key = target_ext.lower().lstrip(".")
    if target_key not in EXPORT_FORMATS:
        raise HTTPException(status_code=400, detail=f"Adobe export target is not supported: {target_ext}")

    output_path = input_path.parent / f"{output_stem}.{target_key}"

    try:
        from adobe.pdfservices.operation.exception.exceptions import (
            SdkException,
            ServiceApiException,
            ServiceUsageException,
        )
        from adobe.pdfservices.operation.pdf_services_media_type import PDFServicesMediaType
        from adobe.pdfservices.operation.pdfjobs.jobs.export_pdf_job import ExportPDFJob
        from adobe.pdfservices.operation.pdfjobs.params.export_pdf.export_pdf_params import ExportPDFParams
        from adobe.pdfservices.operation.pdfjobs.params.export_pdf.export_pdf_target_format import (
            ExportPDFTargetFormat,
        )
        from adobe.pdfservices.operation.pdfjobs.result.export_pdf_result import ExportPDFResult

        pdf_services = _pdf_services(settings)
        input_asset = pdf_services.upload(
            input_stream=input_path.read_bytes(),
            mime_type=PDFServicesMediaType.PDF,
        )
        params = ExportPDFParams(
            target_format=getattr(ExportPDFTargetFormat, EXPORT_FORMATS[target_key]),
        )
        job = ExportPDFJob(input_asset=input_asset, export_pdf_params=params)
        location = pdf_services.submit(job)
        response = pdf_services.get_job_result(location, ExportPDFResult)
        result_asset = response.get_result().get_asset()
        stream_asset = pdf_services.get_content(result_asset)
        _write_stream_asset(stream_asset, output_path)
    except (ServiceApiException, ServiceUsageException, SdkException) as exc:
        shutil.rmtree(input_path.parent, ignore_errors=True)
        raise HTTPException(status_code=502, detail=f"Adobe PDF Services export failed. {exc}") from exc
    except Exception as exc:
        shutil.rmtree(input_path.parent, ignore_errors=True)
        raise HTTPException(status_code=502, detail="Adobe PDF Services export failed.") from exc

    if not output_path.exists() or output_path.stat().st_size == 0:
        shutil.rmtree(input_path.parent, ignore_errors=True)
        raise HTTPException(status_code=502, detail="Adobe PDF Services did not return a file.")

    return output_path, f"{output_stem}.{target_key}"


def run_adobe_create_pdf(input_path: Path, output_stem: str, settings: Settings) -> tuple[Path, str]:
    suffix = input_path.suffix.lower()
    media_type_name = CREATE_MEDIA_TYPES.get(suffix)
    if not media_type_name:
        raise HTTPException(status_code=400, detail=f"Adobe create PDF input is not supported: {suffix}")

    output_path = input_path.parent / f"{output_stem}.pdf"

    try:
        from adobe.pdfservices.operation.exception.exceptions import (
            SdkException,
            ServiceApiException,
            ServiceUsageException,
        )
        from adobe.pdfservices.operation.pdf_services_media_type import PDFServicesMediaType
        from adobe.pdfservices.operation.pdfjobs.jobs.create_pdf_job import CreatePDFJob
        from adobe.pdfservices.operation.pdfjobs.result.create_pdf_result import CreatePDFResult

        pdf_services = _pdf_services(settings)
        input_asset = pdf_services.upload(
            input_stream=input_path.read_bytes(),
            mime_type=getattr(PDFServicesMediaType, media_type_name),
        )
        job = CreatePDFJob(input_asset)
        location = pdf_services.submit(job)
        response = pdf_services.get_job_result(location, CreatePDFResult)
        result_asset = response.get_result().get_asset()
        stream_asset = pdf_services.get_content(result_asset)
        _write_stream_asset(stream_asset, output_path)
    except (ServiceApiException, ServiceUsageException, SdkException) as exc:
        shutil.rmtree(input_path.parent, ignore_errors=True)
        raise HTTPException(status_code=502, detail=f"Adobe PDF Services create PDF failed. {exc}") from exc
    except Exception as exc:
        shutil.rmtree(input_path.parent, ignore_errors=True)
        raise HTTPException(status_code=502, detail="Adobe PDF Services create PDF failed.") from exc

    if not output_path.exists() or output_path.stat().st_size == 0:
        shutil.rmtree(input_path.parent, ignore_errors=True)
        raise HTTPException(status_code=502, detail="Adobe PDF Services did not return a file.")

    return output_path, f"{output_stem}.pdf"
