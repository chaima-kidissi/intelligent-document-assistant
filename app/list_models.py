from google import genai
import os
from dotenv import load_dotenv
import os

load_dotenv()

print("KEY =", os.getenv("GEMINI_API_KEY"))

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

models = client.models.list()

for m in models:
    print(m.name)