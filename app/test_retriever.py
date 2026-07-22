from app.retriever import semantic_search

docs = semantic_search("objectif du projet", k=3)

print("\n===== RESULT =====")
print(docs)