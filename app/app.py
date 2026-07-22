import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

from app.retriever import semantic_search_with_scores, _vectorstore_has_documents
from app.generator import generate_answer
from app.vector_store import add_document_to_vectorstore
from app.auth import get_current_user, require_role, UserAuth

app = FastAPI(title="Q&R Desk API")

# CORS — allow the Vite dev server et le serveur React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Configuration Keycloak Admin ----------

KEYCLOAK_URL = "http://keycloak:8080"
REALM = "rag-realm"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"


def _get_admin_token() -> str:
    """
    Obtient un token d'administration depuis Keycloak via le flux
    Resource Owner Password Credentials sur le realm master.
    """
    token_url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    try:
        response = httpx.post(
            token_url,
            data={
                "grant_type": "password",
                "client_id": "admin-cli",
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD,
            },
            timeout=10,
        )
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Impossible d'obtenir le token admin Keycloak: {str(e)}",
        )


def _admin_headers() -> dict:
    """Renvoie les en-têtes d'autorisation pour l'API Admin Keycloak."""
    token = _get_admin_token()
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Schemas ----------

class ChatRequest(BaseModel):
    question: str
    active_document: str | None = None


class SourceOut(BaseModel):
    file: str
    page: int
    score: float
    excerpt: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceOut]

class DocumentOut(BaseModel):
    id: str
    name: str
    type: str


class CreateUserRequest(BaseModel):
    """Schéma pour la création d'un utilisateur via l'API admin."""
    username: str
    password: str
    roles: list[str] = []


class UpdateRolesRequest(BaseModel):
    """Schéma pour la mise à jour des rôles d'un utilisateur."""
    roles: list[str] = []


# ---------- Routes existantes ----------

@app.get("/documents", response_model=list[DocumentOut])
async def get_documents(current_user: UserAuth = Depends(get_current_user)):
    """
    Renvoie la liste des documents présents dans le corpus.
    """
    corpus_dir = Path("corpus/word")
    if not corpus_dir.exists():
        return []

    docs = []
    for i, file_path in enumerate(corpus_dir.glob("*.*")):
        docs.append(DocumentOut(
            id=str(i),
            name=file_path.name,
            type=file_path.suffix.strip(".")
        ))
    return docs

@app.post("/upload")
async def upload_document(file: UploadFile = File(...), current_user: UserAuth = Depends(get_current_user)):
    """
    Reçoit un fichier (.docx), l'enregistre et l'indexe dans la base vectorielle.
    """
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Seuls les fichiers .docx sont supportés pour le moment.")
    
    corpus_dir = Path("corpus/word")
    corpus_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = corpus_dir / file.filename
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
            
        # Indexer le fichier
        add_document_to_vectorstore(str(file_path))
        
        return {"message": f"Fichier {file.filename} uploadé et indexé avec succès !"}
    except Exception as e:
        if file_path.exists():
            file_path.unlink()  # Cleanup
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, current_user: UserAuth = Depends(get_current_user)):
    """
    Reçoit une question, interroge le pipeline RAG et renvoie
    la réponse + les sources utilisées avec leurs scores.
    """

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="La question est vide.")

    try:
        # 1. Générer la réponse (semantic_search interne retourne [] si base vide)
        answer, _ = generate_answer(req.question, active_document=req.active_document)

        # 2. Sources uniquement si la base contient des documents et si l'LLM n'a pas mis le flag NO_SOURCES
        sources = []
        
        # Liste des salutations courantes pour filtrage rapide
        question_clean = req.question.strip().lower()
        greetings = ["bonjour", "bonjour !", "salut", "salut !", "bonsoir", "bonsoir !", "coucou", "hello", "hey"]
        is_greeting = question_clean in greetings

        if "[NO_SOURCES]" in answer:
            answer = answer.replace("[NO_SOURCES]", "").strip()
            
        if not is_greeting and "[NO_SOURCES]" not in answer and _vectorstore_has_documents():
            scored_docs = semantic_search_with_scores(req.question, k=4, active_document=req.active_document)
            seen_files = set()
            for doc, score in scored_docs:
                # Ignorer les documents avec un score négatif ou très faible (ex: -4% comme sur la capture)
                if float(score) <= 0.0:
                    continue
                    
                filename = doc.metadata.get("source", "Inconnu")
                if filename not in seen_files:
                    seen_files.add(filename)
                    sources.append(
                        SourceOut(
                            file=filename,
                            page=doc.metadata.get("page", 0),
                            score=round(float(score), 4),
                            excerpt=doc.page_content[:300],
                        )
                    )

        return ChatResponse(answer=answer, sources=sources)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du traitement : {str(e)}",
        )


# ---------- Route utilisateur ----------

@app.get("/me")
async def get_me(current_user: UserAuth = Depends(get_current_user)):
    """
    Renvoie les informations de l'utilisateur connecté (nom + rôles).
    """
    return {"username": current_user.username, "roles": current_user.roles}


# ---------- Routes Admin ----------

@app.get("/admin/users")
async def admin_list_users(current_user: UserAuth = Depends(get_current_user)):
    """
    Liste tous les utilisateurs du realm Keycloak.
    Requiert le rôle 'admin'.
    """
    headers = _admin_headers()
    try:
        response = httpx.get(
            f"{KEYCLOAK_URL}/admin/realms/{REALM}/users",
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
        users = response.json()

        # Enrichir chaque utilisateur avec ses rôles realm
        result = []
        for user in users:
            user_id = user["id"]
            roles_resp = httpx.get(
                f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm",
                headers=headers,
                timeout=10,
            )
            user_roles = []
            if roles_resp.status_code == 200:
                user_roles = [r["name"] for r in roles_resp.json()]

            result.append({
                "id": user_id,
                "username": user.get("username"),
                "enabled": user.get("enabled"),
                "roles": user_roles,
            })

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Keycloak: {str(e)}")


@app.post("/admin/users", status_code=201)
async def admin_create_user(
    body: CreateUserRequest,
    current_user: UserAuth = Depends(require_role("admin")),
):
    """
    Crée un nouvel utilisateur dans Keycloak et lui assigne les rôles demandés.
    Requiert le rôle 'admin'.
    """
    headers = _admin_headers()
    try:
        # 1. Créer l'utilisateur
        create_resp = httpx.post(
            f"{KEYCLOAK_URL}/admin/realms/{REALM}/users",
            headers=headers,
            json={
                "username": body.username,
                "enabled": True,
                "credentials": [
                    {"type": "password", "value": body.password, "temporary": False}
                ],
            },
            timeout=10,
        )
        if create_resp.status_code == 409:
            raise HTTPException(status_code=409, detail="L'utilisateur existe déjà")
        create_resp.raise_for_status()

        # 2. Récupérer l'ID du nouvel utilisateur
        users_resp = httpx.get(
            f"{KEYCLOAK_URL}/admin/realms/{REALM}/users",
            headers=headers,
            params={"username": body.username, "exact": "true"},
            timeout=10,
        )
        users_resp.raise_for_status()
        users_list = users_resp.json()
        if not users_list:
            raise HTTPException(status_code=500, detail="Utilisateur créé mais introuvable")
        new_user_id = users_list[0]["id"]

        # 3. Assigner les rôles si demandés
        if body.roles:
            _assign_roles(new_user_id, body.roles, headers)

        return {"message": f"Utilisateur '{body.username}' créé avec succès", "id": new_user_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Keycloak: {str(e)}")


@app.put("/admin/users/{user_id}/roles")
async def admin_update_user_roles(
    user_id: str,
    body: UpdateRolesRequest,
    current_user: UserAuth = Depends(require_role("admin")),
):
    """
    Met à jour les rôles realm d'un utilisateur Keycloak.
    Supprime les anciens rôles et assigne les nouveaux.
    Requiert le rôle 'admin'.
    """
    headers = _admin_headers()
    try:
        # 1. Récupérer les rôles actuels de l'utilisateur
        current_roles_resp = httpx.get(
            f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm",
            headers=headers,
            timeout=10,
        )
        current_roles_resp.raise_for_status()
        current_roles = current_roles_resp.json()

        # 2. Supprimer les rôles actuels (sauf les rôles internes Keycloak)
        roles_to_remove = [
            r for r in current_roles
            if r["name"] not in ("default-roles-rag-realm",)
        ]
        if roles_to_remove:
            httpx.request(
                "DELETE",
                f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm",
                headers=headers,
                json=roles_to_remove,
                timeout=10,
            )

        # 3. Assigner les nouveaux rôles
        if body.roles:
            _assign_roles(user_id, body.roles, headers)

        return {"message": f"Rôles mis à jour pour l'utilisateur {user_id}"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Keycloak: {str(e)}")


@app.delete("/admin/users/{user_id}")
async def admin_delete_user(
    user_id: str,
    current_user: UserAuth = Depends(require_role("admin")),
):
    """
    Supprime un utilisateur du realm Keycloak.
    Requiert le rôle 'admin'.
    """
    headers = _admin_headers()
    try:
        response = httpx.delete(
            f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}",
            headers=headers,
            timeout=10,
        )
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Utilisateur introuvable")
        response.raise_for_status()
        return {"message": f"Utilisateur {user_id} supprimé avec succès"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Keycloak: {str(e)}")


@app.get("/admin/stats")
async def admin_stats(current_user: UserAuth = Depends(require_role("admin"))):
    """
    Renvoie les statistiques globales : nombre de documents et nombre d'utilisateurs.
    Requiert le rôle 'admin'.
    """
    # Compter les documents dans le corpus
    corpus_dir = Path("corpus/word")
    doc_count = 0
    if corpus_dir.exists():
        doc_count = len(list(corpus_dir.glob("*.*")))

    # Compter les utilisateurs Keycloak
    user_count = 0
    try:
        headers = _admin_headers()
        response = httpx.get(
            f"{KEYCLOAK_URL}/admin/realms/{REALM}/users",
            headers=headers,
            params={"max": 1000},
            timeout=10,
        )
        response.raise_for_status()
        user_count = len(response.json())
    except Exception:
        pass  # En cas d'erreur Keycloak, on renvoie 0

    return {"document_count": doc_count, "user_count": user_count}


@app.delete("/admin/documents/{doc_name}")
async def admin_delete_document(
    doc_name: str,
    current_user: UserAuth = Depends(require_role("admin")),
):
    """
    Supprime un document du corpus par son nom de fichier.
    Requiert le rôle 'admin'.
    """
    corpus_dir = Path("corpus/word")
    file_path = corpus_dir / doc_name

    # Vérifier que le chemin reste dans le répertoire corpus (sécurité)
    if not file_path.resolve().is_relative_to(corpus_dir.resolve()):
        raise HTTPException(status_code=400, detail="Chemin de fichier invalide")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Document '{doc_name}' introuvable")

    try:
        file_path.unlink()
        return {"message": f"Document '{doc_name}' supprimé avec succès"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")


# ---------- Fonctions utilitaires Admin ----------

def _assign_roles(user_id: str, role_names: list[str], headers: dict):
    """
    Assigne une liste de rôles realm à un utilisateur Keycloak.
    Récupère d'abord les définitions de rôles disponibles dans le realm.
    """
    # Récupérer tous les rôles disponibles dans le realm
    roles_resp = httpx.get(
        f"{KEYCLOAK_URL}/admin/realms/{REALM}/roles",
        headers=headers,
        timeout=10,
    )
    roles_resp.raise_for_status()
    available_roles = {r["name"]: r for r in roles_resp.json()}

    # Filtrer les rôles demandés qui existent réellement
    roles_to_assign = []
    for role_name in role_names:
        if role_name in available_roles:
            roles_to_assign.append(available_roles[role_name])

    if not roles_to_assign:
        return

    # Assigner les rôles à l'utilisateur
    assign_resp = httpx.post(
        f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm",
        headers=headers,
        json=roles_to_assign,
        timeout=10,
    )
    assign_resp.raise_for_status()
