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

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   # On Windows
   .venv\Scripts\activate
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Database Setup**
   - Create a PostgreSQL database named `education_platform_db`
   - Update database connection in `config.py` if needed

5. **Environment Configuration**
   - Create a `.env` file in the root directory (optional)
   - Default values are provided in `config.py`

6. **Seed the Database**
   ```bash
   python seed_data.py
   ```

7. **Run the Application**
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

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

## Development

### Project Structure
```
backend/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration settings
├── database.py            # Database connection and session
├── models.py              # SQLAlchemy models
├── schemas.py             # Pydantic schemas
├── auth.py                # Authentication utilities
├── crud.py                # Database CRUD operations
├── file_utils.py          # File upload utilities
├── seed_data.py           # Database seeding script
├── requirements.txt       # Python dependencies
├── routers/               # API route handlers
│   ├── __init__.py
│   ├── auth.py
│   ├── courses.py
│   ├── announcements.py
│   └── materials.py
└── uploads/               # File upload directory
    ├── materials/
    └── images/
```

## Testing the API

You can test the API using the provided `test_main.http` file or directly through the Swagger UI at `/docs`.

Example API calls:

1. **Register a new user**:
   ```bash
   curl -X POST "http://localhost:8000/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","username":"testuser","full_name":"Test User","password":"password123","role":"student"}'
   ```

2. **Login**:
   ```bash
   curl -X POST "http://localhost:8000/api/auth/login" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=test@example.com&password=password123"
   ```

3. **Get courses** (with authentication):
   ```bash
   curl -X GET "http://localhost:8000/api/courses/" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## License

This project is part of the eUčenje learning platform. 