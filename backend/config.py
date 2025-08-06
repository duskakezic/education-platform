from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database Configuration
    database_url: str = "postgresql://postgres:postgres@localhost:5432/education_platform_db"
    
    # JWT Configuration
    secret_key: str = "pKzAvPzrWxkViItNVAYQL+mcp2MKx+ZCSmTll2Sa9/s="
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # File Upload Configuration
    upload_dir: str = "uploads"
    max_file_size: int = 10485760  # 10MB in bytes
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    class Config:
        env_file = ".env"


settings = Settings() 