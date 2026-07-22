from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.loaders import load_documents


def split_documents(documents):

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )

    # Création des chunks
    chunks = text_splitter.split_documents(documents)

    # Vérifier que les métadonnées sont conservées
    print(chunks[0].metadata)

    return chunks


if __name__ == "__main__":

    docs = load_documents("corpus/word")

    print(f"Documents chargés : {len(docs)}")

    chunks = split_documents(docs)

    print(f"Nombre de chunks générés : {len(chunks)}")

    for i, chunk in enumerate(chunks[:3]):
        print("\n" + "=" * 50)
        print(f"Chunk {i+1}")
        print("=" * 50)
        print(chunk.page_content)