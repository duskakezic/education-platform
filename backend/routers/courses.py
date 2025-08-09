from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_active_user
from crud import (
    get_courses, get_course, create_enrollment, get_user_enrollments,
    delete_enrollment, is_user_enrolled_in_course, get_user_enrollment_count
)
from schemas import CourseResponse, EnrollmentCreate, EnrollmentResponse, EnrollmentWithCourseResponse
from models import User, UserRole

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=List[CourseResponse])
def get_all_courses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all available courses"""
    courses = get_courses(db, skip=skip, limit=limit)
    return courses


@router.get("/my-enrollments", response_model=List[EnrollmentWithCourseResponse])
def get_my_enrollments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's enrollments"""
    enrollments = get_user_enrollments(db, current_user.id)
    return enrollments


@router.post("/enroll", response_model=EnrollmentResponse)
def enroll_in_course(
    enrollment: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Enroll current user in a course"""
    # Check if course exists
    course = get_course(db, enrollment.course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if user is already enrolled
    if is_user_enrolled_in_course(db, current_user.id, enrollment.course_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this course"
        )
    
    # Check enrollment limit (max 3 courses)
    if get_user_enrollment_count(db, current_user.id) >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot enroll in more than 3 courses"
        )
    
    try:
        db_enrollment = create_enrollment(db, current_user.id, enrollment.course_id)
        return db_enrollment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{course_id}", response_model=CourseResponse)
def get_course_by_id(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific course by ID"""
    course = get_course(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    return course


@router.delete("/unenroll/{course_id}")
def unenroll_from_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Unenroll current user from a course"""
    # Check if course exists
    course = get_course(db, course_id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, course_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enrolled in this course"
        )
    
    success = delete_enrollment(db, current_user.id, course_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unenroll from course"
        )
    
    return {"message": "Successfully unenrolled from course"} 