# eUčenje - Smart Online Learning Platform

A comprehensive backend API for an e-learning platform that facilitates the exchange of materials between professors and students.

## Features

### Core Platform Mechanics
- **User Management**: Both professors and students can enroll in courses (max 3 courses per user)
- **Course System**: Predefined courses with announcements and learning materials sections
- **Role-Based Access**: Different functionalities for professors and students

### Professor Capabilities
- Add announcements with text and images
- Upload learning materials (PDF and text files)
- Modify existing announcements
- Delete learning materials

### Student Capabilities
- Read announcements for enrolled courses
- React to announcements (like/dislike)
- Download learning materials
- Leave comments on announcements
- Edit/delete their own comments

## Technical Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **File Upload**: Support for PDF and text files
- **Documentation**: Auto-generated Swagger/OpenAPI docs

## Setup Instructions

### Prerequisites

1. **Python 3.8+**
2. **PostgreSQL** installed and running
3. **pip** for package management

## API Documentation

Once the server is running, you can access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Courses
- `GET /api/courses/` - Get all courses
- `GET /api/courses/{course_id}` - Get specific course
- `POST /api/courses/enroll` - Enroll in course
- `GET /api/courses/my-enrollments` - Get user enrollments
- `DELETE /api/courses/unenroll/{course_id}` - Unenroll from course

### Announcements
- `GET /api/announcements/course/{course_id}` - Get course announcements
- `GET /api/announcements/{announcement_id}` - Get specific announcement
- `POST /api/announcements/` - Create announcement (professors only)
- `PUT /api/announcements/{announcement_id}` - Update announcement
- `DELETE /api/announcements/{announcement_id}` - Delete announcement

### Reactions
- `POST /api/announcements/{announcement_id}/react` - React to announcement
- `DELETE /api/announcements/{announcement_id}/react` - Remove reaction

### Comments
- `GET /api/announcements/{announcement_id}/comments` - Get announcement comments
- `POST /api/announcements/{announcement_id}/comments` - Create comment
- `PUT /api/announcements/comments/{comment_id}` - Update comment
- `DELETE /api/announcements/comments/{comment_id}` - Delete comment

### Learning Materials
- `GET /api/materials/course/{course_id}` - Get course materials
- `GET /api/materials/{material_id}` - Get specific material
- `POST /api/materials/` - Upload material (professors only)
- `DELETE /api/materials/{material_id}` - Delete material
- `GET /api/materials/download/{material_id}` - Download material

## Sample Users

After running the seed script, you'll have these sample users:

### Professors
- `prof1@example.com` / `password123`
- `prof2@example.com` / `password123`
- `prof3@example.com` / `password123`
- `prof4@example.com` / `password123`

### Students
- `student1@example.com` / `password123`
- `student2@example.com` / `password123`
- `student3@example.com` / `password123`
- `student4@example.com` / `password123`
- `student5@example.com` / `password123`
- `student6@example.com` / `password123`

## Sample Courses

The seed script creates 8 predefined courses:
- Programiranje 1 (PRG1)
- Programiranje 2 (PRG2)
- Baze podataka (BDP)
- Web programiranje (WEB)
- Algoritmi i strukture podataka (ALG)
- Softversko inženjerstvo (SIN)
- Računarske mreže (RM)
- Operativni sistemi (OS)

## File Upload

- **Learning Materials**: PDF and text files (max 10MB)
- **Announcement Images**: JPG, JPEG, PNG, GIF, WEBP (max 10MB)
- Files are stored in the `uploads/` directory

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for professors and students
- **Password Hashing**: Bcrypt password hashing
- **Input Validation**: Comprehensive data validation
- **File Type Validation**: Secure file upload validation

## Architecture

The application follows clean architecture principles:

- **Models**: SQLAlchemy ORM models
- **Schemas**: Pydantic validation schemas
- **CRUD**: Database operations layer
- **Routers**: API endpoint handlers
- **Auth**: Authentication and authorization
- **Config**: Application configuration