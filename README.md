# 📄 Intelligent Document Assistant

An intelligent internal document search assistant powered by **RAG (Retrieval-Augmented Generation)**. Upload your documents, ask questions in natural language, and get accurate answers grounded in your own data — with source citations.

## ✨ Features

- 🔍 **Semantic Search** — Find relevant information across uploaded documents using vector similarity search
- 🤖 **AI-Powered Answers** — Generate accurate, context-aware responses using LLaMA 3.3 70B via Groq
- 📁 **Document Management** — Upload, list, and delete `.docx` documents through the UI
- 🔐 **Authentication & Authorization** — Keycloak-based SSO with role-based access control (RBAC)
- 👤 **Admin Dashboard** — Manage users, roles, and documents from a dedicated admin panel
- 📊 **Source Citations** — Every answer includes relevant source excerpts with confidence scores
- 💬 **Chat Interface** — Modern, responsive chat UI with conversation history

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   React Frontend│────▶│  FastAPI Backend │────▶│    Keycloak      │
│   (Vite + TS)   │     │   (Python)      │     │   (Auth Server)  │
│   Port: 3000    │     │   Port: 8000    │     │   Port: 8080     │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                   ┌────▼────┐      ┌─────▼─────┐
                   │ ChromaDB│      │  Groq API  │
                   │ (Vector │      │ (LLaMA 3.3)│
                   │  Store) │      │            │
                   └─────────┘      └────────────┘
```

### RAG Pipeline

1. **Document Ingestion** — `.docx` files are loaded, split into chunks, and embedded using HuggingFace sentence-transformers
2. **Vector Storage** — Embeddings are stored in ChromaDB for efficient similarity search
3. **Semantic Retrieval** — User queries are embedded and matched against stored document chunks
4. **Answer Generation** — Retrieved context is sent to LLaMA 3.3 70B (via Groq) to generate grounded answers

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **LangChain** | RAG orchestration & document processing |
| **ChromaDB** | Vector database for embeddings |
| **Groq** | LLM inference (LLaMA 3.3 70B) |
| **Sentence-Transformers** | Document & query embeddings |
| **Keycloak** | Identity & access management |
| **Python-Jose** | JWT token validation |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool & dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **Keycloak-JS** | Frontend authentication |
| **Framer Motion** | Animations |
| **React Markdown** | Markdown rendering in chat |
| **Axios** | HTTP client |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker & Docker Compose** | Containerization |
| **Keycloak** | SSO & RBAC |

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Groq API Key](https://console.groq.com/) (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chaima-kidissi/intelligent-document-assistant.git
   cd intelligent-document-assistant
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   | Service | URL |
   |---|---|
   | Frontend | [http://localhost:3000](http://localhost:3000) |
   | Backend API | [http://localhost:8000](http://localhost:8000) |
   | Keycloak Admin | [http://localhost:8080](http://localhost:8080) |
   | API Docs (Swagger) | [http://localhost:8000/docs](http://localhost:8000/docs) |

### Default Keycloak Credentials

| Account | Username | Password |
|---|---|---|
| Keycloak Admin Console | `admin` | `admin` |

## 📡 API Endpoints

### Authentication Required (Bearer Token)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat` | Ask a question to the RAG assistant |
| `POST` | `/upload` | Upload a `.docx` document |
| `GET` | `/documents` | List all uploaded documents |
| `GET` | `/me` | Get current user info & roles |

### Admin Only (requires `admin` role)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/users` | List all Keycloak users |
| `POST` | `/admin/users` | Create a new user |
| `PUT` | `/admin/users/{id}/roles` | Update user roles |
| `DELETE` | `/admin/users/{id}` | Delete a user |
| `GET` | `/admin/stats` | Get system statistics |
| `DELETE` | `/admin/documents/{name}` | Delete a document |

## 📂 Project Structure

```
intelligent-document-assistant/
├── app/                        # Backend application
│   ├── app.py                  # FastAPI main app & routes
│   ├── auth.py                 # Keycloak JWT authentication
│   ├── generator.py            # LLM answer generation (Groq)
│   ├── retriever.py            # Semantic search & retrieval
│   ├── vector_store.py         # ChromaDB vector store management
│   ├── embeddings.py           # Embedding model configuration
│   ├── chunking.py             # Document chunking strategy
│   └── loaders.py              # Document file loaders
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # UI components (Chat, Sidebar, Header...)
│   │   ├── pages/              # Page views (Home, Login, Admin)
│   │   ├── contexts/           # React contexts
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API service layer
│   │   └── types/              # TypeScript type definitions
│   ├── Dockerfile
│   └── package.json
├── corpus/                     # Uploaded documents storage
│   └── word/                   # .docx files
├── chroma_db/                  # ChromaDB persistent storage
├── docker-compose.yml          # Multi-service orchestration
├── Dockerfile                  # Backend Docker image
├── keycloak-realm.json         # Keycloak realm configuration
├── requirements.txt            # Python dependencies
└── .env.example                # Environment variables template
```

## 🔧 Development

### Run Backend Locally (without Docker)

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.app:app --reload --port 8000
```

### Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server will start at [http://localhost:5173](http://localhost:5173).

## 👩‍💻 Author

**Chaima Kidissi**

## 📄 License

This project was developed as part of an internship at [Addinn Group](https://www.addinn-group.com/).
