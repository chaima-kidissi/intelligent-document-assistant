from pathlib import Path
from langchain_community.document_loaders import Docx2txtLoader


def load_documents(folder_path: str):

    documents = []

    for file in Path(folder_path).glob("*.docx"):

        print(f"Chargement : {file.name}")

        loader = Docx2txtLoader(str(file))
        docs = loader.load()

        # Ajouter les métadonnées
        for doc in docs:
            doc.metadata["source"] = file.name

        documents.extend(docs)

    return documents


def load_single_document(file_path: str):
    file = Path(file_path)
    print(f"Chargement : {file.name}")
    
    loader = Docx2txtLoader(str(file))
    docs = loader.load()
    
    # Ajouter les métadonnées
    for doc in docs:
        doc.metadata["source"] = file.name
        
    return docs

if __name__ == "__main__":

    docs = load_documents("corpus/word")

    print(docs[0].metadata)