from app.loaders import load_documents
from app.chunking import split_documents
from app.vector_store import create_vectorstore


def test_ingestion():

    print("=" * 60)
    print("TEST DE LA CHAINE D'INGESTION")
    print("=" * 60)

    # 1. Chargement
    docs = load_documents("corpus/word")
    print(f"Documents chargés : {len(docs)}")

    assert len(docs) > 0, "Aucun document chargé."

    # 2. Chunking
    chunks = split_documents(docs)
    print(f"Chunks générés : {len(chunks)}")

    assert len(chunks) > 0, "Aucun chunk généré."

    # 3. Base vectorielle
    db = create_vectorstore()

    nb_vectors = db._collection.count()

    print(f"Vecteurs indexés : {nb_vectors}")

    assert nb_vectors == len(chunks), "Erreur d'indexation."

    print("\nTous les tests sont réussis.")


if __name__ == "__main__":
    test_ingestion()