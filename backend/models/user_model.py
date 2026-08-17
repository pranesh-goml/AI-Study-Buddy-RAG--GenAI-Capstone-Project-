from pydantic import BaseModel, EmailStr
from typing import Optional

# User registration/login model
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# User DB model (MongoDB)
class UserInDB(BaseModel):
    id: Optional[str]
    email: EmailStr
    hashed_password: str
