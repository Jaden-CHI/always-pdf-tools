import shutil
import subprocess
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.config import Settings


WORD_EXTENSIONS = {".doc", ".docx"}
EXCEL_EXTENSIONS = {".xls", ".xlsx"}


def safe_stem(filename: str) -> str:
    stem = Path(filename).stem.strip() or "converted"
    cleaned = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in stem)
    return cleaned[:80] or "converted"


async def save_upload(file: UploadFile, target: Path, max_bytes: int) -> None:
    total = 0
    with target.open("wb") as output:
        while chunk := await file.read(1024 * 1024):
            total += len(chunk)
            if total > max_bytes:
                raise HTTPException(status_code=413, detail="File is too large.")
            output.write(chunk)


def ensure_extension(filename: str, allowed: set[str]) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in allowed:
        allowed_text = ", ".join(sorted(allowed))
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {allowed_text}")
    return suffix


def prepare_office_upload(file: UploadFile, settings: Settings, allowed: set[str]) -> tuple[Path, str]:
    filename = file.filename or "upload"
    suffix = ensure_extension(filename, allowed)
    job_id = uuid4().hex
    job_dir = Path(tempfile.mkdtemp(prefix=f"{job_id}-", dir=settings.work_dir))
    input_path = job_dir / f"input{suffix}"
    return input_path, safe_stem(filename)


def run_soffice(input_path: Path, output_stem: str, settings: Settings) -> tuple[Path, str]:
    job_dir = input_path.parent
    command = [
        settings.soffice_path,
        "--headless",
        "--nologo",
        "--nofirststartwizard",
        "--convert-to",
        "pdf",
        "--outdir",
        str(job_dir),
        str(input_path),
    ]

    try:
        subprocess.run(
            command,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=settings.conversion_timeout_seconds,
        )
    except FileNotFoundError as exc:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="LibreOffice executable was not found.") from exc
    except subprocess.TimeoutExpired as exc:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=504, detail="Conversion timed out.") from exc
    except subprocess.CalledProcessError as exc:
        shutil.rmtree(job_dir, ignore_errors=True)
        stderr = exc.stderr.decode("utf-8", errors="replace")[:500]
        raise HTTPException(status_code=422, detail=f"Conversion failed. {stderr}") from exc

    outputs = sorted(job_dir.glob("*.pdf"))
    if not outputs:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=422, detail="Converted PDF was not created.")

    return outputs[0], f"{output_stem}.pdf"


def cleanup_file_parent(path: Path) -> None:
    shutil.rmtree(path.parent, ignore_errors=True)
