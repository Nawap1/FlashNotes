from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
from langchain_community.chat_models import ChatOllama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.schema import Document
from langchain.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate

chat_model = None
embeddings = None
vector_store = None
conversation_chains = {}

def initialize_chat_ollama():
    return ChatOllama(
        base_url="http://localhost:11434",
        model="qwen3",
        callbacks=[StreamingStdOutCallbackHandler()]  # Updated from callback_manager
    )

def initialize_embeddings():
    return OllamaEmbeddings(
        base_url="http://localhost:11434",
        model="qwen3"
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize your global variables
    global chat_model, embeddings, vector_store
    chat_model = initialize_chat_ollama()
    embeddings = initialize_embeddings()
    vector_store = Chroma(embedding_function=embeddings, collection_name="chatbot_docs")
    yield
    conversation_chains.clear()

# Initialize FastAPI app with lifespan
app = FastAPI(title="RAG Chatbot API", lifespan=lifespan)

# Pydantic models
class ChatMessage(BaseModel):
    query: str
    conversation_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    answer: str
    conversation_id: str
    sources: List[str]

class DocumentInput(BaseModel):
    content: str
    metadata: Optional[Dict] = None

def create_rag_chain_with_memory(chat_model, vector_store, conversation_id):
    system_template = "<|im_start|>system\nYou are a helpful AI assistant that provides clear and concise information based on the given context and chat history.<|im_end|>"
    system_message_prompt = SystemMessagePromptTemplate.from_template(system_template)
    human_template = "<|im_start|>user\nContext: {context}\nChat History: {chat_history}\nQuestion: {question}<|im_end|>"
    human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
    assistant_template = "<|im_start|>assistant\n"
    chat_prompt = ChatPromptTemplate.from_messages([
        system_message_prompt,
        human_message_prompt,
        assistant_template
    ])

    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    return ConversationalRetrievalChain.from_llm(
        llm=chat_model,
        retriever=vector_store.as_retriever(),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": chat_prompt},
        return_source_documents=True
    )

@app.post("/add_document")
async def add_document(document: DocumentInput):
    """Add a document to the vector store"""
    global vector_store
    try:
        doc = Document(page_content=document.content, metadata=document.metadata or {})
        text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
        docs = text_splitter.split_documents([doc])
        vector_store = Chroma.from_documents(
            documents=docs,
            embedding=embeddings,
            collection_name="chatbot_docs"
        )
        return {"message": "Document added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Chat with the RAG chatbot"""
    try:
        if message.conversation_id not in conversation_chains:
            conversation_chains[message.conversation_id] = create_rag_chain_with_memory(
                chat_model, vector_store, message.conversation_id
            )
        
        chain = conversation_chains[message.conversation_id]
        response = chain({"question": message.query})
        
        sources = [
            f"{doc.metadata.get('source', 'unknown')} - {doc.page_content[:100]}..."
            for doc in response.get("source_documents", [])
        ]
        
        return ChatResponse(
            answer=response["answer"],
            conversation_id=message.conversation_id,
            sources=sources
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation and its memory"""
    if conversation_id in conversation_chains:
        del conversation_chains[conversation_id]
        return {"message": f"Conversation {conversation_id} deleted successfully"}
    raise HTTPException(status_code=404, detail="Conversation not found")

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)