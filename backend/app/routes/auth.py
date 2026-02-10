"""
Firebase authentication endpoints
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
import os

from app.config import settings

router = APIRouter()

# Initialize Firebase Admin SDK
firebase_app = None


def get_firebase_app():
    global firebase_app
    if firebase_app is None:
        try:
            cred_path = settings.firebase_credentials_path
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_app = firebase_admin.initialize_app(cred)
            else:
                # Try to use default credentials (for cloud environments)
                firebase_app = firebase_admin.initialize_app()
        except ValueError:
            # App already initialized
            firebase_app = firebase_admin.get_app()
    return firebase_app


@router.post("/verify-token")
async def verify_token(authorization: Optional[str] = Header(None)):
    """
    Verify Firebase ID token from frontend
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split("Bearer ")[1]
    
    try:
        get_firebase_app()
        decoded_token = auth.verify_id_token(token)
        
        return {
            "valid": True,
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name")
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
