from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from typing import List, Optional
from models import User, Course, Enrollment, Announcement, LearningMaterial, Reaction, Comment, UserRole, ReactionType
from schemas import UserCreate, CourseCreate, AnnouncementCreate, LearningMaterialCreate, ReactionCreate, CommentCreate
from auth import get_password_hash


# User CRUD operations
def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Course CRUD operations
def get_course(db: Session, course_id: int) -> Optional[Course]:
    return db.query(Course).filter(Course.id == course_id).first()


def get_courses(db: Session, skip: int = 0, limit: int = 100) -> List[Course]:
    return db.query(Course).filter(Course.is_active == True).offset(skip).limit(limit).all()


def create_course(db: Session, course: CourseCreate) -> Course:
    db_course = Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


# Enrollment CRUD operations
def get_user_enrollments(db: Session, user_id: int) -> List[Enrollment]:
    return db.query(Enrollment).options(joinedload(Enrollment.course)).filter(Enrollment.user_id == user_id).all()


def get_course_enrollments(db: Session, course_id: int) -> List[Enrollment]:
    return db.query(Enrollment).filter(Enrollment.course_id == course_id).all()


def get_user_enrollment_count(db: Session, user_id: int) -> int:
    return db.query(Enrollment).filter(Enrollment.user_id == user_id).count()


def is_user_enrolled_in_course(db: Session, user_id: int, course_id: int) -> bool:
    return db.query(Enrollment).filter(
        and_(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
    ).first() is not None


def create_enrollment(db: Session, user_id: int, course_id: int) -> Enrollment:
    # Check if user is already enrolled in this course
    if is_user_enrolled_in_course(db, user_id, course_id):
        raise ValueError("User is already enrolled in this course")
    
    # Check if user has reached the maximum of 3 courses
    if get_user_enrollment_count(db, user_id) >= 3:
        raise ValueError("User cannot enroll in more than 3 courses")
    
    db_enrollment = Enrollment(user_id=user_id, course_id=course_id)
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment


def delete_enrollment(db: Session, user_id: int, course_id: int) -> bool:
    enrollment = db.query(Enrollment).filter(
        and_(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
    ).first()
    if enrollment:
        db.delete(enrollment)
        db.commit()
        return True
    return False


# Announcement CRUD operations
def get_announcement(db: Session, announcement_id: int) -> Optional[Announcement]:
    return db.query(Announcement).options(joinedload(Announcement.author)).filter(Announcement.id == announcement_id).first()


def get_announcements_by_course(db: Session, course_id: int, skip: int = 0, limit: int = 100) -> List[Announcement]:
    return db.query(Announcement).options(joinedload(Announcement.author)).filter(Announcement.course_id == course_id).order_by(Announcement.created_at.desc()).offset(skip).limit(limit).all()


def get_user_announcements(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Announcement]:
    return db.query(Announcement).filter(Announcement.author_id == user_id).offset(skip).limit(limit).all()


def create_announcement(db: Session, announcement: AnnouncementCreate, author_id: int) -> Announcement:
    db_announcement = Announcement(**announcement.dict(), author_id=author_id)
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    # Reload with author information
    return db.query(Announcement).options(joinedload(Announcement.author)).filter(Announcement.id == db_announcement.id).first()


def update_announcement(db: Session, announcement_id: int, announcement_data: dict) -> Optional[Announcement]:
    db_announcement = get_announcement(db, announcement_id)
    if db_announcement:
        for key, value in announcement_data.items():
            if value is not None:
                setattr(db_announcement, key, value)
        db.commit()
        db.refresh(db_announcement)
        # Reload with author information
        return db.query(Announcement).options(joinedload(Announcement.author)).filter(Announcement.id == announcement_id).first()
    return None


def delete_announcement(db: Session, announcement_id: int) -> bool:
    announcement = get_announcement(db, announcement_id)
    if announcement:
        db.delete(announcement)
        db.commit()
        return True
    return False


# Learning Material CRUD operations
def get_learning_material(db: Session, material_id: int) -> Optional[LearningMaterial]:
    return db.query(LearningMaterial).filter(LearningMaterial.id == material_id).first()


def get_learning_materials_by_course(db: Session, course_id: int, skip: int = 0, limit: int = 100) -> List[LearningMaterial]:
    return db.query(LearningMaterial).filter(LearningMaterial.course_id == course_id).order_by(LearningMaterial.created_at.desc()).offset(skip).limit(limit).all()


def create_learning_material(db: Session, material: LearningMaterialCreate, author_id: int, file_url: str, file_name: str, file_size: int) -> LearningMaterial:
    db_material = LearningMaterial(
        **material.dict(),
        author_id=author_id,
        file_url=file_url,
        file_name=file_name,
        file_size=file_size
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


def delete_learning_material(db: Session, material_id: int) -> bool:
    material = get_learning_material(db, material_id)
    if material:
        db.delete(material)
        db.commit()
        return True
    return False


# Reaction CRUD operations
def get_user_reaction_on_announcement(db: Session, user_id: int, announcement_id: int) -> Optional[Reaction]:
    return db.query(Reaction).filter(
        and_(Reaction.user_id == user_id, Reaction.announcement_id == announcement_id)
    ).first()


def create_or_update_reaction(db: Session, user_id: int, announcement_id: int, reaction_type: ReactionType) -> Reaction:
    existing_reaction = get_user_reaction_on_announcement(db, user_id, announcement_id)
    
    if existing_reaction:
        existing_reaction.reaction_type = reaction_type
        db.commit()
        db.refresh(existing_reaction)
        return existing_reaction
    else:
        db_reaction = Reaction(
            user_id=user_id,
            announcement_id=announcement_id,
            reaction_type=reaction_type
        )
        db.add(db_reaction)
        db.commit()
        db.refresh(db_reaction)
        return db_reaction


def delete_reaction(db: Session, user_id: int, announcement_id: int) -> bool:
    reaction = get_user_reaction_on_announcement(db, user_id, announcement_id)
    if reaction:
        db.delete(reaction)
        db.commit()
        return True
    return False


def get_announcement_reaction_counts(db: Session, announcement_id: int) -> dict:
    like_count = db.query(Reaction).filter(
        and_(Reaction.announcement_id == announcement_id, Reaction.reaction_type == ReactionType.LIKE)
    ).count()
    
    dislike_count = db.query(Reaction).filter(
        and_(Reaction.announcement_id == announcement_id, Reaction.reaction_type == ReactionType.DISLIKE)
    ).count()
    
    return {"like_count": like_count, "dislike_count": dislike_count}


# Comment CRUD operations
def get_comment(db: Session, comment_id: int) -> Optional[Comment]:
    return db.query(Comment).filter(Comment.id == comment_id).first()


def get_comments_by_announcement(db: Session, announcement_id: int, skip: int = 0, limit: int = 100) -> List[Comment]:
    return db.query(Comment).options(joinedload(Comment.author)).filter(Comment.announcement_id == announcement_id).offset(skip).limit(limit).all()


def create_comment(db: Session, comment: CommentCreate, author_id: int) -> Comment:
    db_comment = Comment(**comment.dict(), author_id=author_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    # Reload with author information
    return db.query(Comment).options(joinedload(Comment.author)).filter(Comment.id == db_comment.id).first()


def update_comment(db: Session, comment_id: int, content: str) -> Optional[Comment]:
    try:
        db_comment = get_comment(db, comment_id)
        if db_comment:
            db_comment.content = content
            db.commit()
            db.refresh(db_comment)
            return db_comment
        return None
    except Exception as e:
        db.rollback()
        print(f"Error updating comment: {e}")
        return None


def delete_comment(db: Session, comment_id: int) -> bool:
    comment = get_comment(db, comment_id)
    if comment:
        db.delete(comment)
        db.commit()
        return True
    return False


def get_announcement_comment_count(db: Session, announcement_id: int) -> int:
    return db.query(Comment).filter(Comment.announcement_id == announcement_id).count() 