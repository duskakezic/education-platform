# eUčenje Backend API Documentation

## Overview

The eUčenje backend is a FastAPI-based REST API that provides a smart online learning platform. It supports two user roles: **Professors** and **Students**, with different permissions and capabilities for each role.

## Base URL

```
http://localhost:8000
```

## Authentication

The API uses JWT (JSON Web Token) authentication. All protected endpoints require a valid Bearer token in the Authorization header.

### Authentication Flow

1. **Register** a new user account
2. **Login** to receive an access token
3. Include the token in subsequent requests as `Authorization: Bearer <token>`

### Token Format

```
Authorization: Bearer <access_token>
```

## Data Models

### User Roles
- `professor` - Can create/edit announcements and materials
- `student` - Can react to announcements, comment, and download materials

### Core Entities
- **User** - System users (professors/students)
- **Course** - Learning courses (max 3 per user)
- **Enrollment** - User-course relationships
- **Announcement** - Course announcements with optional images
- **LearningMaterial** - Course materials (PDF/text files)
- **Reaction** - Like/dislike reactions on announcements
- **Comment** - Comments on announcements

## API Endpoints

### 1. Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "full_name": "Full Name",
  "password": "password123",
  "role": "professor" | "student"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "full_name": "Full Name",
  "role": "professor",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00"
}
```

**Validation Rules:**
- Password must be at least 8 characters
- Email must be unique
- Username must be unique

#### POST `/api/auth/login`
Login and receive access token.

**Request Body (form-data):**
```
username: user@example.com
password: password123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### GET `/api/auth/me`
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "full_name": "Full Name",
  "role": "professor",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00"
}
```

### 2. Course Endpoints

#### GET `/api/courses/`
Get all available courses.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records (default: 100)

**Response:**
```json
[
  {
    "id": 1,
    "name": "Programiranje 1",
    "description": "Uvod u programiranje i algoritme",
    "code": "PRG1",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00"
  }
]
```

#### GET `/api/courses/{course_id}`
Get a specific course by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "name": "Programiranje 1",
  "description": "Uvod u programiranje i algoritme",
  "code": "PRG1",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00"
}
```

#### POST `/api/courses/enroll`
Enroll current user in a course.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "course_id": 1
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "course_id": 1,
  "enrolled_at": "2024-01-01T00:00:00"
}
```

**Validation Rules:**
- User can enroll in maximum 3 courses
- Cannot enroll in the same course twice

#### GET `/api/courses/my-enrollments`
Get current user's enrollments.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "course_id": 1,
    "enrolled_at": "2024-01-01T00:00:00"
  }
]
```

#### DELETE `/api/courses/unenroll/{course_id}`
Unenroll from a course.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Successfully unenrolled from course"
}
```

### 3. Announcement Endpoints

#### GET `/api/announcements/course/{course_id}`
Get all announcements for a specific course.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records (default: 100)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Important Announcement",
    "content": "This is an important announcement",
    "course_id": 1,
    "image_url": "/uploads/images/abc123.jpg",
    "author_id": 1,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": null,
    "like_count": 5,
    "dislike_count": 1,
    "comment_count": 3
  }
]
```

#### GET `/api/announcements/{announcement_id}`
Get a specific announcement by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "title": "Important Announcement",
  "content": "This is an important announcement",
  "course_id": 1,
  "image_url": "/uploads/images/abc123.jpg",
  "author_id": 1,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": null,
  "like_count": 5,
  "dislike_count": 1,
  "comment_count": 3
}
```

#### POST `/api/announcements/`
Create a new announcement (Professors only).

**Headers:** `Authorization: Bearer <token>`

**Request Body (form-data):**
```
title: "Announcement Title"
content: "Announcement content"
course_id: 1
image: [file] (optional)
```

**Response:**
```json
{
  "id": 1,
  "title": "Announcement Title",
  "content": "Announcement content",
  "course_id": 1,
  "image_url": "/uploads/images/abc123.jpg",
  "author_id": 1,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": null,
  "like_count": 0,
  "dislike_count": 0,
  "comment_count": 0
}
```

**File Upload Rules:**
- Supported image formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Maximum file size: 10MB

#### PUT `/api/announcements/{announcement_id}`
Update an announcement (Author only).

**Headers:** `Authorization: Bearer <token>`

**Request Body (form-data):**
```
title: "Updated Title" (optional)
content: "Updated content" (optional)
image: [file] (optional)
```

**Response:**
```json
{
  "id": 1,
  "title": "Updated Title",
  "content": "Updated content",
  "course_id": 1,
  "image_url": "/uploads/images/def456.jpg",
  "author_id": 1,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T01:00:00",
  "like_count": 5,
  "dislike_count": 1,
  "comment_count": 3
}
```

#### DELETE `/api/announcements/{announcement_id}`
Delete an announcement (Author only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Announcement deleted successfully"
}
```

### 4. Reaction Endpoints

#### POST `/api/announcements/{announcement_id}/react`
React to an announcement (Students only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "announcement_id": 1,
  "reaction_type": "like" | "dislike"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "announcement_id": 1,
  "reaction_type": "like",
  "created_at": "2024-01-01T00:00:00"
}
```

#### DELETE `/api/announcements/{announcement_id}/react`
Remove reaction from an announcement.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Reaction removed successfully"
}
```

### 5. Comment Endpoints

#### GET `/api/announcements/{announcement_id}/comments`
Get all comments for an announcement.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records (default: 100)

**Response:**
```json
[
  {
    "id": 1,
    "content": "Great announcement!",
    "announcement_id": 1,
    "author_id": 1,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": null
  }
]
```

#### POST `/api/announcements/{announcement_id}/comments`
Create a comment on an announcement (Students only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Great announcement!",
  "announcement_id": 1
}
```

**Response:**
```json
{
  "id": 1,
  "content": "Great announcement!",
  "announcement_id": 1,
  "author_id": 1,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": null
}
```

#### PUT `/api/announcements/comments/{comment_id}`
Update a comment (Author only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

**Response:**
```json
{
  "id": 1,
  "content": "Updated comment content",
  "announcement_id": 1,
  "author_id": 1,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T01:00:00"
}
```

#### DELETE `/api/announcements/comments/{comment_id}`
Delete a comment (Author only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Comment deleted successfully"
}
```

### 6. Learning Materials Endpoints

#### GET `/api/materials/course/{course_id}`
Get all learning materials for a specific course.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records (default: 100)

**Response:**
```json
[
  {
    "id": 1,
    "title": "Lecture Notes",
    "description": "Important lecture notes",
    "course_id": 1,
    "file_url": "/uploads/materials/abc123.pdf",
    "file_name": "lecture_notes.pdf",
    "file_size": 1024000,
    "author_id": 1,
    "created_at": "2024-01-01T00:00:00"
  }
]
```

#### GET `/api/materials/{material_id}`
Get a specific learning material by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "title": "Lecture Notes",
  "description": "Important lecture notes",
  "course_id": 1,
  "file_url": "/uploads/materials/abc123.pdf",
  "file_name": "lecture_notes.pdf",
  "file_size": 1024000,
  "author_id": 1,
  "created_at": "2024-01-01T00:00:00"
}
```

#### POST `/api/materials/`
Create a new learning material (Professors only).

**Headers:** `Authorization: Bearer <token>`

**Request Body (form-data):**
```
title: "Lecture Notes"
description: "Important lecture notes"
course_id: 1
file: [file]
```

**Response:**
```json
{
  "id": 1,
  "title": "Lecture Notes",
  "description": "Important lecture notes",
  "course_id": 1,
  "file_url": "/uploads/materials/abc123.pdf",
  "file_name": "lecture_notes.pdf",
  "file_size": 1024000,
  "author_id": 1,
  "created_at": "2024-01-01T00:00:00"
}
```

**File Upload Rules:**
- Supported file formats: `.pdf`, `.txt`
- Maximum file size: 10MB

#### DELETE `/api/materials/{material_id}`
Delete a learning material (Author only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Learning material deleted successfully"
}
```

#### GET `/api/materials/download/{material_id}`
Download a learning material file.

**Headers:** `Authorization: Bearer <token>`

**Response:** File download (binary data)

### 7. Health Check Endpoints

#### GET `/`
Get API information.

**Response:**
```json
{
  "message": "Welcome to eUčenje API",
  "version": "1.0.0",
  "docs": "/docs",
  "redoc": "/redoc"
}
```

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "API is running"
}
```

## Error Responses

All endpoints return standard HTTP status codes and error messages in the following format:

```json
{
  "detail": "Error message description"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## File Upload Guidelines

### Image Upload (Announcements)
- **Supported formats:** JPG, JPEG, PNG, GIF, WebP
- **Maximum size:** 10MB
- **Storage location:** `/uploads/images/`

### File Upload (Learning Materials)
- **Supported formats:** PDF, TXT
- **Maximum size:** 10MB
- **Storage location:** `/uploads/materials/`

## Security Considerations

1. **JWT Tokens:** Access tokens expire after 30 minutes
2. **Password Hashing:** Passwords are hashed using bcrypt
3. **Role-based Access:** Different endpoints require different user roles
4. **File Validation:** All uploaded files are validated for type and size
5. **CORS:** Configured to allow frontend origins

## Database Schema

### Users Table
- `id` (Primary Key)
- `email` (Unique)
- `username` (Unique)
- `hashed_password`
- `full_name`
- `role` (professor/student)
- `is_active`
- `created_at`
- `updated_at`

### Courses Table
- `id` (Primary Key)
- `name`
- `description`
- `code` (Unique)
- `is_active`
- `created_at`

### Enrollments Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `course_id` (Foreign Key)
- `enrolled_at`

### Announcements Table
- `id` (Primary Key)
- `title`
- `content`
- `image_url` (Optional)
- `author_id` (Foreign Key)
- `course_id` (Foreign Key)
- `created_at`
- `updated_at`

### Learning Materials Table
- `id` (Primary Key)
- `title`
- `description`
- `file_url`
- `file_name`
- `file_size`
- `author_id` (Foreign Key)
- `course_id` (Foreign Key)
- `created_at`

### Reactions Table
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `announcement_id` (Foreign Key)
- `reaction_type` (like/dislike)
- `created_at`

### Comments Table
- `id` (Primary Key)
- `content`
- `author_id` (Foreign Key)
- `announcement_id` (Foreign Key)
- `created_at`
- `updated_at`

## Sample Data

The backend includes seed data with:
- 8 predefined courses
- 4 sample professors
- 6 sample students
- All users have password: `password123`

## Development Setup

1. **Install dependencies:** `pip install -r requirements.txt`
2. **Set up database:** PostgreSQL with connection string in config
3. **Run migrations:** Tables are created automatically
4. **Seed data:** Run `python seed_data.py`
5. **Start server:** `python main.py` or `uvicorn main:app --reload`

## API Documentation

Interactive API documentation is available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## Testing

Use the provided `test_main.http` file for testing endpoints with tools like VS Code REST Client or Postman. 