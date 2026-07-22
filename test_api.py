import requests

response = requests.post(
    "http://127.0.0.1:8000/chat",
    json={"question": "Quelles sont les règles de télétravail ?"}
)
print("Status Code:", response.status_code)
print("Response JSON:")
print(response.json())
