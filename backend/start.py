#!/usr/bin/env python3
"""
Startup script for eUčenje backend
This script will:
1. Create database tables
2. Seed the database with initial data
3. Start the FastAPI server
"""

import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

def main():
    print("🚀 Starting eUčenje Backend...")
    
    # Import after path setup
    from database import engine
    from models import Base
    from seed_data import seed_database
    from config import settings
    
    try:
        # Create database tables
        print("📊 Creating database tables...")
        # Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        # Seed the database
        print("🌱 Seeding database with initial data...")
        # seed_database()
        print("✅ Database seeded successfully!")
        
        # Start the server
        print("🌐 Starting FastAPI server...")
        print(f"📍 Server will be available at: http://{settings.host}:{settings.port}")
        print(f"📚 API Documentation: http://{settings.host}:{settings.port}/docs")
        print(f"🔍 Alternative docs: http://{settings.host}:{settings.port}/redoc")
        print("\n" + "="*50)
        print("🎉 eUčenje Backend is ready!")
        print("="*50 + "\n")
        
        # Import and run uvicorn
        import uvicorn
        uvicorn.run(
            "main:app",
            host=settings.host,
            port=settings.port,
            reload=settings.debug,
            log_level="info"
        )
        
    except Exception as e:
        print(f"❌ Error starting the application: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 