import os
from dotenv import load_dotenv
from groq import Groq
import time
import sys

# Ensure app directory is in path if run from root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.retriever import semantic_search

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY is missing.")

client = Groq(api_key=api_key)

MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant"
]

def test_model(model_name, question, context):
    prompt = f"""
Tu es un assistant intelligent de recherche documentaire.
Tu dois répondre uniquement à partir du contexte fourni.
Si les informations nécessaires ne sont pas présentes dans le contexte, réponds exactement :
"Cette question est en dehors du périmètre des documents disponibles."
N'invente jamais de réponse.

Contexte :
{context}

Question :
{question}
"""
    try:
        start_time = time.time()
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0,
        )
        latency = time.time() - start_time
        return response.choices[0].message.content, latency
    except Exception as e:
        return f"Erreur: {str(e)}", 0

def run_tests():
    question = "Quels sont les points clés abordés lors de l'atelier sur la gouvernance des données ?"
    documents = semantic_search(question, k=4)
    
    with open("result_models.txt", "w", encoding="utf-8") as f:
        if not documents:
            f.write("Aucun document trouvé pour la question.\n")
            return
            
        context = "\n\n".join([doc.page_content for doc in documents])
        f.write(f"--- Question: {question} ---\n")
        f.write(f"Nombre de documents de contexte: {len(documents)}\n\n")
        
        for model in MODELS:
            f.write(f"Testing {model}...\n")
            answer, latency = test_model(model, question, context)
            f.write(f"Latence: {latency:.2f} secondes\n")
            f.write(f"Réponse:\n{answer}\n\n")
            f.write("-" * 50 + "\n")

if __name__ == "__main__":
    run_tests()
