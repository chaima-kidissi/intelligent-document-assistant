import os
import sqlite3
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings


def _get_embedding_model():
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )


def _vectorstore_has_documents() -> bool:
    """
    Vérifie rapidement si ChromaDB contient des documents
    en lisant directement le fichier SQLite — sans charger le modèle d'embeddings.
    """
    sqlite_path = os.path.join("chroma_db", "chroma.sqlite3")
    if not os.path.exists(sqlite_path):
        return False
    try:
        conn = sqlite3.connect(sqlite_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM embeddings")
        count = cursor.fetchone()[0]
        conn.close()
        return count > 0
    except Exception:
        return False


def load_vectorstore():
    """
    Charge la base vectorielle ChromaDB.
    """
    return Chroma(
        persist_directory="chroma_db",
        embedding_function=_get_embedding_model(),
        collection_name="documents_entreprise",
    )


def semantic_search(query, k=3, active_document=None):
    """
    Recherche les k passages les plus pertinents.
    Retourne une liste vide si aucun document n'est indexé.
    """
    if not _vectorstore_has_documents():
        return []

    vectorstore = load_vectorstore()
    filter_dict = {"source": active_document} if active_document else None
    results = vectorstore.similarity_search(query=query, k=k, filter=filter_dict)
    return results


def semantic_search_with_scores(query, k=3, active_document=None):
    """
    Recherche les k passages les plus pertinents avec leurs scores de similarité.
    Retourne une liste vide si aucun document n'est indexé.
    """
    if not _vectorstore_has_documents():
        return []

    vectorstore = load_vectorstore()
    filter_dict = {"source": active_document} if active_document else None
    results = vectorstore.similarity_search_with_relevance_scores(
        query=query, k=k, filter=filter_dict
    )
    return results