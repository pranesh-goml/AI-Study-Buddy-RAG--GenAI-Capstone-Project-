# AI Study Buddy RAG – Capstone Decision Gate & Mapping Summary

This document maps out the GenAI architectural decisions made for the **AI Study Buddy RAG** capstone project. It provides an immediate overview of which techniques are leveraged in the application and which were omitted, along with detailed implementation logs and rationale.

---

## GenAI Technique Decision Matrix

| Technique / Component | Decision Status |
| :--- | :--- |
| **Prompting** | ✅ USED |
| **RAG (Retrieval Augmented Generation)** | ✅ USED |
| **GraphRAG** | ❌ NOT USED |
| **Chunking** | ✅ USED |
| **Embeddings** | ✅ USED |
| **Vector Database** | ✅ USED |
| **Knowledge Graph** | ❌ NOT USED |
| **Agentic AI** | ❌ NOT USED |
| **Fine-Tuning** | ❌ NOT USED |
| **Distillation** | ❌ NOT USED |
| **LLMOps** | ✅ USED |

---

## Detailed Technique Mapping

### Prompting

| Field | Details |
|---------|---------|
| Decision | Used |
| Implementation | Dynamic system prompts direct the model to answer questions using only document context, format quizzes as clean multiple-choice JSON blocks with difficulty tags, and structure flashcards with front/back fields. |
| Justification | Restricts generative responses to source-grounded materials and guarantees reliable parsing of LLM outputs on the frontend. |

---

### RAG (Retrieval Augmented Generation)

| Field | Details |
|---------|---------|
| Decision | Used |
| Implementation | Queries the local vector collection with semantic search vectors, extracts the top $N$ document chunks, and injects them as a text context header for the LLM to use during answer generation. |
| Justification | Solves model cutoff dates and ensures student answers are fully traceable to pages in their textbooks, preventing hallucinations. |

---

### GraphRAG

| Field | Details |
|---------|---------|
| Decision | Not Used |
| Implementation | Not implemented. |
| Justification | Standard semantic vector search is sufficient for searching course notes. Hierarchical relationship mapping via Neo4j is out of scope and would introduce high configuration and hosting complexity. |

---

### Chunking

| Field | Details |
|---------|---------|
| Decision | Used (Overlap character chunking) |
| Implementation | Processes text via sliding window segmentation (`create_text_chunks`), splitting content into 500-character segments with a 50-character overlap to retain text boundaries. Only non-empty chunks are indexed. |
| Justification | Keeps vector context blocks small and precise for similarity search while preserving contextual flow between adjacent nodes. |

---

### Embeddings

| Field | Details |
|---------|---------|
| Decision | Used |
| Implementation | Encodes text segments and user queries into 384-dimensional dense vectors using the `all-MiniLM-L6-v2` SentenceTransformer model (run locally in Python). |
| Justification | Powers query semantic matching based on conceptual meaning, synonyms, and topics instead of exact keyword hits. |

---

### Vector Database

| Field | Details |
|---------|---------|
| Decision | Used |
| Implementation | Uses a local persistent vector database via ChromaDB's `PersistentClient` with collections partitioned by `note_id`. |
| Justification | Enables zero-cost local database deployment, fast query execution, and complete data privacy without third-party cloud vectors. |

---

### Knowledge Graph

| Field | Details |
|---------|---------|
| Decision | Not Used |
| Implementation | Not implemented. |
| Justification | Complex network graph storage is unnecessary. Metadata relations (users, note states, quiz logs, and card progress) are modeled and stored in a standard MongoDB document database. |

---

### Agentic AI

| Field | Details |
|---------|---------|
| Decision | Not Used |
| Implementation | Not implemented. |
| Justification | App features are linear and deterministic (Ingest → Query/Generate → Show). There is no need for autonomous multi-step planning or external tool-calling loops. |

---

### Fine-Tuning

| Field | Details |
|---------|---------|
| Decision | Not Used |
| Implementation | Uses general pretrained models (SentenceTransformer and Ollama/HuggingFace LLMs) out of the box. |
| Justification | RAG and instruction prompt engineering provide sufficient domain grounding without high compute/dataset maintenance overhead. |

---

### Distillation

| Field | Details |
|---------|---------|
| Decision | Not Used |
| Implementation | Pretrained models are run as-is. |
| Justification | Local small language models (SLMs like Phi-3 via Ollama) and cloud inference fallbacks are fast enough for prototype study sessions. |

---

### LLMOps

| Field | Details |
|---------|---------|
| Decision | Used (Local Infrastructure Observability) |
| Implementation | Utilizes typed Pydantic models for request/response structures, FastAPI `BackgroundTasks` to parse PDFs asynchronously, database health endpoints (`/health` & `/mongo-health`), and a multi-tier LLM failover system (Ollama → HuggingFace → excerpt snippet fallback). |
| Justification | Prevents interface lockups during file processing, ensures schema integrity, and avoids silent app crashes when local model hosts go offline. |

---

## Summary: Used vs. Not Used Techniques

### ✅ Used Techniques

*   **Prompting**: Custom system prompts used to enforce domain grounding and direct JSON structural formatting for quizzes and flashcards.
*   **RAG**: Dynamic injection of retrieved course material chunks directly into context queries for document-restricted outputs.
*   **Chunking**: 500-character sliding segments with 50-character overlap to index raw document streams.
*   **Embeddings**: Semantic mapping via local `all-MiniLM-L6-v2` dense vectors.
*   **Vector Database**: High-speed, local persistence database partitioned by document IDs using ChromaDB.
*   **LLMOps**: Pydantic inputs validation, FastAPI background job handlers, API health check diagnostics, and multi-tier LLM fallback logic.

### ❌ Not Used Techniques

*   **GraphRAG**: Excluded in favor of standard vector space retrieval, eliminating Graph query latency and index build costs.
*   **Knowledge Graph**: Excluded as metadata tracking and relationship storage (such as user accounts and review metrics) are fully resolved using MongoDB.
*   **Agentic AI**: Excluded as all study operations are structured and do not require multi-step agent actions or planning loops.
*   **Fine-Tuning**: Excluded to ensure immediate document updates are indexed without the delays or high costs of model retraining.
*   **Distillation**: Excluded since small models (Phi-3) perform adequately on consumer CPUs without distillation compression.
