from pydantic import BaseModel
from typing import List, Optional, Dict

class ChatMessage(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]

class DocumentInput(BaseModel):
    content: str
    metadata: Optional[Dict] = None

class MultipleDocumentInput(BaseModel):
    documents: List[DocumentInput]
