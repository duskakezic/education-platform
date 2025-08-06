from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Course, User, UserRole
from crud import create_course, create_user
from schemas import CourseCreate, UserCreate


def create_sample_courses(db: Session):
    """Create sample courses"""
    courses_data = [
        {
            "name": "Programiranje 1",
            "description": "Uvod u programiranje i algoritme",
            "code": "PRG1"
        },
        {
            "name": "Programiranje 2",
            "description": "Napredno programiranje i objektno orijentisano programiranje",
            "code": "PRG2"
        },
        {
            "name": "Baze podataka",
            "description": "SQL, relacione baze podataka i upravljanje podacima",
            "code": "BDP"
        },
        {
            "name": "Web programiranje",
            "description": "HTML, CSS, JavaScript i web tehnologije",
            "code": "WEB"
        },
        {
            "name": "Algoritmi i strukture podataka",
            "description": "Analiza algoritama i implementacija struktura podataka",
            "code": "ALG"
        },
        {
            "name": "Softversko inženjerstvo",
            "description": "Metodologije razvoja softvera i upravljanje projektima",
            "code": "SIN"
        },
        {
            "name": "Računarske mreže",
            "description": "TCP/IP, mrežni protokoli i komunikacija",
            "code": "RM"
        },
        {
            "name": "Operativni sistemi",
            "description": "Upravljanje resursima i procesima",
            "code": "OS"
        }
    ]
    
    for course_data in courses_data:
        course = CourseCreate(**course_data)
        create_course(db, course)
    
    print(f"Created {len(courses_data)} sample courses")


def create_sample_users(db: Session):
    """Create sample users (professors and students)"""
    users_data = [
        # Professors
        {
            "email": "prof1@example.com",
            "username": "prof1",
            "full_name": "Dr. Marko Petrović",
            "password": "password123",
            "role": UserRole.PROFESSOR
        },
        {
            "email": "prof2@example.com",
            "username": "prof2",
            "full_name": "Dr. Ana Jovanović",
            "password": "password123",
            "role": UserRole.PROFESSOR
        },
        {
            "email": "prof3@example.com",
            "username": "prof3",
            "full_name": "Dr. Nikola Đorđević",
            "password": "password123",
            "role": UserRole.PROFESSOR
        },
        {
            "email": "prof4@example.com",
            "username": "prof4",
            "full_name": "Dr. Marija Stojanović",
            "password": "password123",
            "role": UserRole.PROFESSOR
        },
        
        # Students
        {
            "email": "student1@example.com",
            "username": "student1",
            "full_name": "Petar Marković",
            "password": "password123",
            "role": UserRole.STUDENT
        },
        {
            "email": "student2@example.com",
            "username": "student2",
            "full_name": "Jovana Nikolić",
            "password": "password123",
            "role": UserRole.STUDENT
        },
        {
            "email": "student3@example.com",
            "username": "student3",
            "full_name": "Stefan Popović",
            "password": "password123",
            "role": UserRole.STUDENT
        },
        {
            "email": "student4@example.com",
            "username": "student4",
            "full_name": "Ana Đorđević",
            "password": "password123",
            "role": UserRole.STUDENT
        },
        {
            "email": "student5@example.com",
            "username": "student5",
            "full_name": "Milan Stojanović",
            "password": "password123",
            "role": UserRole.STUDENT
        },
        {
            "email": "student6@example.com",
            "username": "student6",
            "full_name": "Jelena Petrović",
            "password": "password123",
            "role": UserRole.STUDENT
        }
    ]
    
    for user_data in users_data:
        user = UserCreate(**user_data)
        create_user(db, user)
    
    print(f"Created {len(users_data)} sample users")


def seed_database():
    """Seed the database with initial data"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_courses = db.query(Course).count()
        existing_users = db.query(User).count()
        
        if existing_courses == 0:
            print("Creating sample courses...")
            create_sample_courses(db)
        else:
            print(f"Database already contains {existing_courses} courses")
        
        if existing_users == 0:
            print("Creating sample users...")
            create_sample_users(db)
        else:
            print(f"Database already contains {existing_users} users")
        
        print("Database seeding completed successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database() 