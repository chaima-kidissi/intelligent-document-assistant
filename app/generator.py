import os
from dotenv import load_dotenv
from groq import Groq

from app.retriever import semantic_search

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError(
        "La variable GROQ_API_KEY est absente du fichier .env."
    )

client = Groq(api_key=api_key)


def generate_answer(question, active_document=None):

    documents = semantic_search(question, k=4, active_document=active_document)

    print(f"\n[DEBUG] Nombre de documents retrouvés : {len(documents)}")

    if not documents:
        # Base vide ou aucun résultat -> réponse libre (salutation, présentation, etc.)
        prompt_libre = (
            "Tu es un assistant intelligent et convivial de recherche documentaire.\n"
            "Réponds de manière naturelle, chaleureuse et concise à ce message.\n"
            "Si c'est une salutation, accueille l'utilisateur et explique-lui qu'il peut "
            "uploader ses documents via le bouton '+' pour commencer à analyser.\n\n"
            f"Message : {question}"
        )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt_libre}],
            temperature=0.7,
        )
        return response.choices[0].message.content, []

    # Base non vide -> mode RAG avec contexte documentaire
    context = "\n\n".join([doc.page_content for doc in documents])

    system_prompt = (
        "Tu es un assistant intelligent et convivial de recherche documentaire.\n\n"
        "INSTRUCTIONS IMPORTANTES :\n"
        "1. Si la question de l'utilisateur est une simple salutation (ex: 'Bonjour', 'Salut', 'Coucou') ou une question générale sur ce que tu sais faire :\n"
        "   -> Réponds poliment et naturellement.\n"
        "   -> Tu DOIS OBLIGATOIREMENT terminer ta réponse par la balise EXACTE : [NO_SOURCES]\n\n"
        "2. Si la question porte sur le contenu des documents ou demande une information spécifique :\n"
        "   -> Tu dois répondre UNIQUEMENT à partir du contexte fourni dans le message de l'utilisateur.\n"
        "   -> NE METS SURTOUT PAS la balise [NO_SOURCES].\n\n"
        "3. Si la réponse à la question posée ne se trouve pas dans le contexte, "
        "réponds exactement : 'Cette question est en dehors du perimètre des documents "
        "disponibles.' N'invente jamais de réponse."
    )

    user_prompt = f"Contexte :\n{context}\n\nQuestion :\n{question}"

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0,
    )

    return response.choices[0].message.content, documents



if __name__ == "__main__":

    while True:

        question = input("\nVotre question (ou 'exit'): ").strip()

        if question.lower() == "exit":
            break

        if not question:
            print("\n Veuillez saisir une question.")
            continue

        try:
            answer, documents = generate_answer(question)

            print("\n===== REPONSE =====\n")
            print(answer)

            print("\n===== SOURCES UTILISEES =====\n")

            for doc in documents:
                source = doc.metadata.get("source", "Inconnu")
                print(f"- {source}")

            print("\n===== PASSAGES UTILISES =====\n")

            for i, doc in enumerate(documents, start=1):
                print(f"Passage {i}")
                print(f"Source : {doc.metadata.get('source')}")
                print()
                print(doc.page_content)
                print("-" * 70)

        except Exception as e:
            print("\n Une erreur est survenue lors de la generation de la reponse.")
            print("Details :", e)