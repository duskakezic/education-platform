from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_active_user
from crud import (
    get_learning_materials_by_course, get_learning_material, create_learning_material,
    delete_learning_material, is_user_enrolled_in_course
)
from schemas import LearningMaterialCreate, LearningMaterialResponse
from models import User, UserRole
from file_utils import save_learning_material, delete_file, get_file_path_from_url
import os

router = APIRouter(prefix="/materials", tags=["learning materials"])


@router.get("/course/{course_id}", response_model=List[LearningMaterialResponse])
def get_course_materials(
    course_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all learning materials for a specific course"""
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    materials = get_learning_materials_by_course(db, course_id, skip=skip, limit=limit)
    return materials


@router.get("/{material_id}", response_model=LearningMaterialResponse)
def get_material_by_id(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific learning material by ID"""
    material = get_learning_material(db, material_id)
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning material not found"
        )
    
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, material.course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    return material


@router.post("/", response_model=LearningMaterialResponse)
async def create_new_material(
    title: str = Form(...),
    description: str = Form(None),
    course_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new learning material (professors only)"""
    # Check if user is a professor
    if current_user.role != UserRole.PROFESSOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only professors can create learning materials"
        )
    
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    # Save the uploaded file
    file_url, file_name, file_size = await save_learning_material(file)
    
    material_data = LearningMaterialCreate(
        title=title,
        description=description,
        course_id=course_id
    )
    
    db_material = create_learning_material(
        db, material_data, current_user.id, file_url, file_name, file_size
    )
    return db_material


@router.delete("/{material_id}")
def delete_material_by_id(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a learning material (professors only)"""
    # Check if user is a professor
    if current_user.role != UserRole.PROFESSOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only professors can delete learning materials"
        )
    
    # Get the material
    material = get_learning_material(db, material_id)
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning material not found"
        )
    
    # Check if user is the author
    if material.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own learning materials"
        )
    
    # Delete the file from filesystem
    file_path = get_file_path_from_url(material.file_url)
    delete_file(file_path)
    
    # Delete from database
    success = delete_learning_material(db, material_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete learning material"
        )
    
    return {"message": "Learning material deleted successfully"}


@router.get("/download/{material_id}")
def download_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Download a learning material file"""
    # Get the material
    material = get_learning_material(db, material_id)
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning material not found"
        )
    
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, material.course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    # Get file path
    file_path = get_file_path_from_url(material.file_url)
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server"
        )
    
    # Return file for download
    return FileResponse(
        path=file_path,
        filename=material.file_name,
        media_type='application/octet-stream'
    ) 