import os
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
from config import settings


def create_upload_dirs():
    """Create upload directories if they don't exist"""
    upload_path = Path(settings.upload_dir)
    materials_path = upload_path / "materials"
    images_path = upload_path / "images"
    
    materials_path.mkdir(parents=True, exist_ok=True)
    images_path.mkdir(parents=True, exist_ok=True)
    
    return materials_path, images_path


def validate_file_type(file: UploadFile, allowed_types: list) -> bool:
    """Validate file type based on extension"""
    if not file.filename:
        return False
    
    file_extension = Path(file.filename).suffix.lower()
    return file_extension in allowed_types


def validate_file_size(file: UploadFile) -> bool:
    """Validate file size"""
    # Read first chunk to check size
    file.file.seek(0, 2)  # Seek to end
    size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    return size <= settings.max_file_size


async def save_upload_file(file: UploadFile, upload_dir: Path, filename: str) -> str:
    """Save uploaded file and return the file path"""
    file_path = upload_dir / filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()
    
    return str(file_path)


async def save_learning_material(file: UploadFile) -> tuple[str, str, int]:
    """Save learning material file and return (file_url, file_name, file_size)"""
    # Validate file type
    allowed_types = ['.pdf', '.txt']
    if not validate_file_type(file, allowed_types):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size
    if not validate_file_size(file):
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_file_size // 1024 // 1024}MB"
        )
    
    # Create upload directories
    materials_path, _ = create_upload_dirs()
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    import uuid
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Save file
    file_path = await save_upload_file(file, materials_path, unique_filename)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    return file_path, file.filename, file_size


async def save_announcement_image(file: UploadFile) -> str:
    """Save announcement image and return the file path"""
    # Validate file type
    allowed_types = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    if not validate_file_type(file, allowed_types):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size
    if not validate_file_size(file):
        raise HTTPException(
            status_code=400,
            detail=f"Image too large. Maximum size: {settings.max_file_size // 1024 // 1024}MB"
        )
    
    # Create upload directories
    _, images_path = create_upload_dirs()
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    import uuid
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Save file
    file_path = await save_upload_file(file, images_path, unique_filename)
    
    return file_path


def delete_file(file_path: str) -> bool:
    """Delete file from filesystem"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception:
        pass
    return False


def get_file_path_from_url(file_url: str) -> str:
    """Convert file URL back to filesystem path"""
    # This assumes the file_url is the actual filesystem path
    # In a production environment, you might want to store relative paths
    return file_url 