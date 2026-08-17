from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import EmailStr
from models.user_model import UserCreate, UserLogin, UserInDB
from utils.jwt_handler import hash_password, verify_password, create_access_token, get_current_user
from database import get_db

router = APIRouter()

# Get database instance
db = get_db()
users_collection = db["users"]

def get_user_by_email(email: str):
	user = users_collection.find_one({"email": email})
	if user:
		return UserInDB(id=str(user.get("_id")), email=user["email"], hashed_password=user["hashed_password"])
	return None

@router.post("/register", status_code=201)
def register(user: UserCreate):
    if get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(user.password)
    user_dict = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed
    }
    users_collection.insert_one(user_dict)
    return {"msg": "User registered successfully"}


@router.post("/login")
def login(user: UserLogin):
	db_user = get_user_by_email(user.email)
	if not db_user or not verify_password(user.password, db_user.hashed_password):
		raise HTTPException(status_code=401, detail="Invalid credentials")
	token = create_access_token({"sub": db_user.email, "user_id": db_user.id})
	return {"access_token": token, "token_type": "bearer"}

# Authenticated endpoint to check token and return user info
from fastapi import Depends

@router.get("/me")
def me(user=Depends(get_current_user)):
	return {"user": user}
