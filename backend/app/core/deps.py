from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode
from app.db.mongodb import collection
security = HTTPBearer(auto_error=False)

def current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    if not creds: raise HTTPException(status_code=401, detail="Authentication required")
    try: p=decode(creds.credentials)
    except Exception: raise HTTPException(status_code=401, detail="Invalid or expired token")
    return p

def require_user(p=Depends(current_user)):
    if p.get("role") not in ("user", "park_owner", "owner"): raise HTTPException(403, "User/owner access required")
    return p

def require_owner(p=Depends(current_user)):
    if p.get("role") not in ("park_owner", "owner"): raise HTTPException(403, "Owner access required")
    return p

def require_admin(p=Depends(current_user)):
    if p.get("role") != "admin": raise HTTPException(403, "Admin access required")
    return p
