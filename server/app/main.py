from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.config import Settings, get_settings
from app.converter import (
    EXCEL_EXTENSIONS,
    WORD_EXTENSIONS,
    cleanup_file_parent,
    prepare_pdf_upload,
    prepare_office_upload,
    run_pdf_to_docx,
    run_pdf_to_xlsx,
    run_soffice,
    save_upload,
)


settings = get_settings()
app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


async def convert_office_file(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    settings: Settings,
    allowed_extensions: set[str],
) -> FileResponse:
    input_path, output_stem = prepare_office_upload(file, settings, allowed_extensions)

    try:
        await save_upload(file, input_path, settings.max_upload_bytes)
        pdf_path, filename = run_soffice(input_path, output_stem, settings)
    except Exception:
        cleanup_file_parent(input_path)
        raise

    background_tasks.add_task(cleanup_file_parent, Path(pdf_path))
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename,
    )


async def convert_pdf_to_word_file(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    settings: Settings,
) -> FileResponse:
    input_path, output_stem = prepare_pdf_upload(file, settings)

    try:
        await save_upload(file, input_path, settings.max_upload_bytes)
        docx_path, filename = run_pdf_to_docx(input_path, output_stem, settings)
    except Exception:
        cleanup_file_parent(input_path)
        raise

    background_tasks.add_task(cleanup_file_parent, Path(docx_path))
    return FileResponse(
        path=docx_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
    )


async def convert_pdf_to_excel_file(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    settings: Settings,
) -> FileResponse:
    input_path, output_stem = prepare_pdf_upload(file, settings)

    try:
        await save_upload(file, input_path, settings.max_upload_bytes)
        xlsx_path, filename = run_pdf_to_xlsx(input_path, output_stem, settings)
    except Exception:
        cleanup_file_parent(input_path)
        raise

    background_tasks.add_task(cleanup_file_parent, Path(xlsx_path))
    return FileResponse(
        path=xlsx_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filename,
    )


@app.post("/convert/word-to-pdf")
async def word_to_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile,
    settings: Settings = Depends(get_settings),
) -> FileResponse:
    return await convert_office_file(file, background_tasks, settings, WORD_EXTENSIONS)


@app.post("/convert/excel-to-pdf")
async def excel_to_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile,
    settings: Settings = Depends(get_settings),
) -> FileResponse:
    return await convert_office_file(file, background_tasks, settings, EXCEL_EXTENSIONS)


@app.post("/convert/pdf-to-word")
async def pdf_to_word(
    background_tasks: BackgroundTasks,
    file: UploadFile,
    settings: Settings = Depends(get_settings),
) -> FileResponse:
    return await convert_pdf_to_word_file(file, background_tasks, settings)


@app.post("/convert/pdf-to-excel")
async def pdf_to_excel(
    background_tasks: BackgroundTasks,
    file: UploadFile,
    settings: Settings = Depends(get_settings),
) -> FileResponse:
    return await convert_pdf_to_excel_file(file, background_tasks, settings)
