from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from database import get_db
from auth import get_current_active_user
from crud import (
    get_announcements_by_course, get_announcement, create_announcement,
    update_announcement, delete_announcement, get_user_announcements,
    create_or_update_reaction, delete_reaction, get_announcement_reaction_counts,
    get_comments_by_announcement, create_comment, update_comment, delete_comment,
    get_announcement_comment_count, is_user_enrolled_in_course, get_comment,
    get_user_reaction_on_announcement
)
from schemas import (
    AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse,
    ReactionCreate, ReactionResponse, CommentCreate, CommentUpdate, CommentResponse, CommentWithAuthor
)
from models import User, UserRole, ReactionType, Comment
from file_utils import save_announcement_image
from fastapi import UploadFile, File, Form

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("/course/{course_id}", response_model=List[AnnouncementResponse])
def get_course_announcements(
    course_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all announcements for a specific course"""
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    announcements = get_announcements_by_course(db, course_id, skip=skip, limit=limit)
    
    # Add reaction and comment counts to each announcement
    for announcement in announcements:
        reaction_counts = get_announcement_reaction_counts(db, announcement.id)
        announcement.like_count = reaction_counts["like_count"]
        announcement.dislike_count = reaction_counts["dislike_count"]
        announcement.comment_count = get_announcement_comment_count(db, announcement.id)
        
        # Add user's current reaction
        user_reaction = get_user_reaction_on_announcement(db, current_user.id, announcement.id)
        if user_reaction:
            announcement.user_reaction = user_reaction.reaction_type.value
        else:
            announcement.user_reaction = None
    
    return announcements


@router.post("/", response_model=AnnouncementResponse)
async def create_new_announcement(
    title: str = Form(...),
    content: str = Form(...),
    course_id: int = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new announcement (professors only)"""
    # Check if user is a professor
    if current_user.role != UserRole.PROFESSOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only professors can create announcements"
        )
    
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    # Handle image upload if provided
    image_url = None
    if image:
        image_url = await save_announcement_image(image)
    
    announcement_data = AnnouncementCreate(
        title=title,
        content=content,
        course_id=course_id,
        image_url=image_url
    )
    
    db_announcement = create_announcement(db, announcement_data, current_user.id)
    return db_announcement


@router.put("/{announcement_id}", response_model=AnnouncementResponse)
async def update_announcement_by_id(
    announcement_id: int,
    title: str = Form(None),
    content: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update an announcement (professors only)"""
    # Check if user is a professor
    if current_user.role != UserRole.PROFESSOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only professors can update announcements"
        )
    
    # Get the announcement
    announcement = get_announcement(db, announcement_id)
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Check if user is the author
    if announcement.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update your own announcements"
        )
    
    # Handle image upload if provided
    image_url = None
    if image:
        image_url = await save_announcement_image(image)
    
    update_data = {}
    if title is not None:
        update_data["title"] = title
    if content is not None:
        update_data["content"] = content
    if image_url is not None:
        update_data["image_url"] = image_url
    
    updated_announcement = update_announcement(db, announcement_id, update_data)
    return updated_announcement


@router.delete("/{announcement_id}")
def delete_announcement_by_id(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an announcement (professors only)"""
    # Check if user is a professor
    if current_user.role != UserRole.PROFESSOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only professors can delete announcements"
        )
    
    # Get the announcement
    announcement = get_announcement(db, announcement_id)
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Check if user is the author
    if announcement.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own announcements"
        )
    
    success = delete_announcement(db, announcement_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete announcement"
        )
    
    return {"message": "Announcement deleted successfully"}


# Reaction endpoints
@router.post("/{announcement_id}/react", response_model=ReactionResponse)
def react_to_announcement(
    announcement_id: int,
    reaction_type: ReactionType = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """React to an announcement (students only)"""
    # Check if user is a student
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can react to announcements"
        )
    
    # Get the announcement
    announcement = get_announcement(db, announcement_id)
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, announcement.course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    # Validate reaction type
    if reaction_type not in [ReactionType.LIKE, ReactionType.DISLIKE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid reaction type: {reaction_type}. Must be 'like' or 'dislike'"
        )
    
    db_reaction = create_or_update_reaction(db, current_user.id, announcement_id, reaction_type)
    return db_reaction


@router.delete("/{announcement_id}/react")
def remove_reaction(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove reaction from an announcement"""
    # Get the announcement
    announcement = get_announcement(db, announcement_id)
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, announcement.course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    success = delete_reaction(db, current_user.id, announcement_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No reaction found to remove"
        )
    
    return {"message": "Reaction removed successfully"}


# Comment endpoints
@router.get("/{announcement_id}/comments", response_model=List[CommentWithAuthor])
def get_announcement_comments(
    announcement_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all comments for an announcement"""
    # Get the announcement
    announcement = get_announcement(db, announcement_id)
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, announcement.course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    comments = get_comments_by_announcement(db, announcement_id, skip=skip, limit=limit)
    return comments


@router.post("/{announcement_id}/comments", response_model=CommentWithAuthor)
def create_announcement_comment(
    announcement_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a comment on an announcement (students only)"""
    # Check if user is a student
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can comment on announcements"
        )
    
    # Get the announcement
    announcement = get_announcement(db, announcement_id)
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, announcement.course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    db_comment = create_comment(db, comment, current_user.id)
    return db_comment


@router.put("/comments/{comment_id}", response_model=CommentWithAuthor)
def update_comment_by_id(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a comment (author only)"""
    # Get the comment
    comment = get_comment(db, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user is the author
    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update your own comments"
        )
    
    updated_comment = update_comment(db, comment_id, comment_update.content)
    if not updated_comment:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update comment"
        )
    
    # Reload with author information for the response
    comment_with_author = db.query(Comment).options(joinedload(Comment.author)).filter(Comment.id == comment_id).first()
    if not comment_with_author:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load comment with author information"
        )
    return comment_with_author


@router.delete("/comments/{comment_id}")
def delete_comment_by_id(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a comment (author only)"""
    # Get the comment
    comment = get_comment(db, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user is the author
    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own comments"
        )
    
    success = delete_comment(db, comment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete comment"
        )
    
    return {"message": "Comment deleted successfully"}


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement_by_id(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific announcement by ID"""
    announcement = get_announcement(db, announcement_id)
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Check if user is enrolled in this course
    if not is_user_enrolled_in_course(db, current_user.id, announcement.course_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    # Add reaction and comment counts
    reaction_counts = get_announcement_reaction_counts(db, announcement.id)
    announcement.like_count = reaction_counts["like_count"]
    announcement.dislike_count = reaction_counts["dislike_count"]
    announcement.comment_count = get_announcement_comment_count(db, announcement.id)
    
    # Add user's current reaction
    user_reaction = get_user_reaction_on_announcement(db, current_user.id, announcement.id)
    if user_reaction:
        announcement.user_reaction = user_reaction.reaction_type.value
    else:
        announcement.user_reaction = None
    
    return announcement 