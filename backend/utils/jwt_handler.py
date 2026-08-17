from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
	token = credentials.credentials if credentials else None
	if not token:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No token provided")
	payload = decode_access_token(token)
	if not payload:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
	return payload
import os
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext

JWT_SECRET = os.getenv("JWT_SECRET", "supersecret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
	return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
	return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: int = ACCESS_TOKEN_EXPIRE_MINUTES):
	to_encode = data.copy()
	expire = datetime.utcnow() + timedelta(minutes=expires_delta)
	to_encode.update({"exp": expire})
	encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
	return encoded_jwt

def decode_access_token(token: str):
	try:
		payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
		return payload
	except jwt.ExpiredSignatureError:
		return None
	except jwt.InvalidTokenError:
		return None
