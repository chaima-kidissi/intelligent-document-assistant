# ChromaDB

import os
import shutil

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

from app.chunking import split_documents
from app.loaders import load_documents, load_single_document


def add_document_to_vectorstore(file_path: str):
    print(f"Ajout du document à la base : {file_path}")
    docs = load_single_document(file_path)
    chunks = split_documents(docs)

    embedding_model = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )

    vectorstore = Chroma(
        embedding_function=embedding_model,
        persist_directory="chroma_db",
        collection_name="documents_entreprise"
    )

    vectorstore.add_documents(chunks)
    print(f"{len(chunks)} chunks ajoutés avec succès.")
    return True


def create_vectorstore():

    # Supprimer l'ancienne base vectorielle si elle existe
    if os.path.exists("chroma_db"):
        shutil.rmtree("chroma_db")
        print("Ancienne base vectorielle supprimée")

    docs = load_documents("corpus/word")

    chunks = split_documents(docs)

    embedding_model = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_model,
        persist_directory="chroma_db",
        collection_name="documents_entreprise"
    )

    print("Index créé avec succès")
    print(f"Nombre de chunks indexés : {len(chunks)}")

    return vectorstore


if __name__ == "__main__":

    db = create_vectorstore()

    print("Base vectorielle indexée")

    collection = db._collection

    print()
    print("Nombre de vecteurs :", collection.count())