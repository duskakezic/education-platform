from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from models import UserRole, ReactionType


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: UserRole


class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Course Schemas
class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None
    code: str


class CourseCreate(CourseBase):
    pass


class CourseResponse(CourseBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Enrollment Schemas
class EnrollmentCreate(BaseModel):
    course_id: int


class EnrollmentResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    enrolled_at: datetime
    
    class Config:
        from_attributes = True


class EnrollmentWithCourseResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    enrolled_at: datetime
    course: CourseResponse
    
    class Config:
        from_attributes = True


# Announcement Schemas
class AnnouncementBase(BaseModel):
    title: str
    content: str
    course_id: int


class AnnouncementCreate(AnnouncementBase):
    image_url: Optional[str] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None


class AnnouncementResponse(AnnouncementBase):
    id: int
    image_url: Optional[str]
    author_id: int
    author: UserResponse
    created_at: datetime
    updated_at: Optional[datetime]
    like_count: int = 0
    dislike_count: int = 0
    comment_count: int = 0
    user_reaction: Optional[str] = None
    
    class Config:
        from_attributes = True


# Learning Material Schemas
class LearningMaterialBase(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: int


class LearningMaterialCreate(LearningMaterialBase):
    pass


class LearningMaterialResponse(LearningMaterialBase):
    id: int
    file_url: str
    file_name: str
    file_size: int
    author_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Reaction Schemas
class ReactionCreate(BaseModel):
    announcement_id: int
    reaction_type: ReactionType


class ReactionResponse(BaseModel):
    id: int
    user_id: int
    announcement_id: int
    reaction_type: ReactionType
    created_at: datetime
    
    class Config:
        from_attributes = True


# Comment Schemas
class CommentBase(BaseModel):
    content: str
    announcement_id: int


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(CommentBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# Response Schemas
class CourseWithEnrollments(CourseResponse):
    enrollments: List[EnrollmentResponse] = []


class AnnouncementWithDetails(AnnouncementResponse):
    author: UserResponse
    course: CourseResponse


class CommentWithAuthor(CommentResponse):
    author: UserResponse


class UserWithEnrollments(UserResponse):
    enrollments: List[EnrollmentResponse] = [] 