from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
from pydantic import BaseModel

security = HTTPBearer()

# Configuration Keycloak
KEYCLOAK_URL = "http://keycloak:8080" # From inside docker
REALM = "rag-realm"
CLIENT_ID = "react-client"

# Pour récupérer la clé publique de Keycloak
JWKS_URL = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/certs"

class UserAuth(BaseModel):
    username: str
    roles: list[str] = []

def get_public_keys():
    try:
        response = httpx.get(JWKS_URL, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Erreur de récupération JWKS: {e}")
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserAuth:
    token = credentials.credentials
    jwks = get_public_keys()
    
    if not jwks:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Impossible de valider le token: serveur d'authentification injoignable"
        )
    
    try:
        # Extraire l'en-tête du token sans le vérifier pour trouver le kid
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Clé publique invalide"
            )
        
        # Validation du token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience="account",
            issuer=f"http://localhost:8080/realms/{REALM}" # Important: from frontend perspective it was issued by localhost
        )
        
        username: str = payload.get("preferred_username")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

        # Extraire les rôles du realm depuis le payload JWT
        roles: list[str] = payload.get("realm_access", {}).get("roles", [])

        return UserAuth(username=username, roles=roles)
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token invalide: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_role(role: str):
    """
    Fabrique de dépendance qui vérifie qu'un utilisateur possède le rôle requis.
    Renvoie HTTP 403 si le rôle est absent.
    """
    async def role_checker(current_user: UserAuth = Depends(get_current_user)) -> UserAuth:
        if role not in current_user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rôle '{role}' requis"
            )
        return current_user
    return role_checker
