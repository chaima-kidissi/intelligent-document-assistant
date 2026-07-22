# génération des embeddings

from langchain_community.embeddings import HuggingFaceEmbeddings
from app.chunking import split_documents
from app.loaders import load_documents


def create_embeddings():

    # Charger les documents
    docs = load_documents("corpus/word")

    # Chunking
    chunks = split_documents(docs)

    # Modèle d'embeddings
    embedding_model = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )

    print("Embedding model chargé ✔")

    return chunks, embedding_model


if __name__ == "__main__":

    chunks, embedding_model = create_embeddings()

    print(f"Nombre de chunks : {len(chunks)}")

    # Test sur un chunk
    vector = embedding_model.embed_query(chunks[0].page_content)

    print("\nVector dimension :", len(vector))