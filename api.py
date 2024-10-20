from contextlib import asynccontextmanager
import os
import shutil
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from langchain_community.chat_models import ChatOllama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.schema import Document, AIMessage, HumanMessage, SystemMessage
from langchain.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate, AIMessagePromptTemplate
from utils import DocumentReader

# Global variables with proper typing
chat_model: Optional[ChatOllama] = None
embeddings: Optional[OllamaEmbeddings] = None
vector_stores: Dict[str, Chroma] = {}  # Map conversation_id to vector store
conversation_chains: Dict[str, ConversationalRetrievalChain] = {}
PERSIST_DIRECTORY = "./db"

class ChatMessage(BaseModel):
    query: str
    conversation_id: str = "default"

class ChatResponse(BaseModel):
    answer: str
    conversation_id: str
    sources: List[str]

class DocumentInput(BaseModel):
    content: str
    metadata: Optional[Dict] = None

def initialize_chat_ollama():
    return ChatOllama(
        base_url="http://localhost:11434",
        model="qwen3",
        callbacks=[StreamingStdOutCallbackHandler()]
    )

def initialize_embeddings():
    return OllamaEmbeddings(
        base_url="http://localhost:11434",
        model="qwen3"
    )

def get_or_create_vector_store(conversation_id: str) -> Chroma:
    """Get or create a vector store for a specific conversation"""
    if conversation_id not in vector_stores:
        persist_path = os.path.join(PERSIST_DIRECTORY, conversation_id)
        vector_stores[conversation_id] = Chroma(
            embedding_function=embeddings,
            collection_name=f"chatbot_docs_{conversation_id}",
            persist_directory=persist_path
        )
    return vector_stores[conversation_id]

def clear_conversation_data(conversation_id: str):
    """Clear all data associated with a conversation"""
    # Remove from memory
    if conversation_id in conversation_chains:
        del conversation_chains[conversation_id]
    
    if conversation_id in vector_stores:
        # Delete the collection
        vector_stores[conversation_id].delete_collection()
        # Remove from memory
        del vector_stores[conversation_id]
        
    # Remove persistence directory
    persist_path = os.path.join(PERSIST_DIRECTORY, conversation_id)
    if os.path.exists(persist_path):
        shutil.rmtree(persist_path)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global chat_model, embeddings
    
    # Initialize models
    chat_model = initialize_chat_ollama()
    embeddings = initialize_embeddings()
    
    # Create persist directory if it doesn't exist
    os.makedirs(PERSIST_DIRECTORY, exist_ok=True)
    
    yield
    
    # Cleanup on shutdown
    for conversation_id in list(vector_stores.keys()):
        clear_conversation_data(conversation_id)
    
    # Remove the persist directory
    if os.path.exists(PERSIST_DIRECTORY):
        shutil.rmtree(PERSIST_DIRECTORY)

app = FastAPI(title="Flash Notes Bot", lifespan=lifespan)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_rag_chain_with_memory(vector_store: Chroma, conversation_id: str) -> ConversationalRetrievalChain:
    """Create a RAG chain with conversation memory"""
    system_message = SystemMessagePromptTemplate.from_template(
        "<|im_start|>system\nYou are a helpful AI assistant that provides clear and concise information based on the given context and chat history.<|im_end|>"
    )
    
    human_message = HumanMessagePromptTemplate.from_template(
        "<|im_start|>user\nContext: {context}\n\nChat History: {chat_history}\n\nQuestion: {question}<|im_end|>"
    )
    
    assistant_message = AIMessagePromptTemplate.from_template(
        "<|im_start|>assistant\n"
    )
    
    chat_prompt = ChatPromptTemplate.from_messages([
        system_message,
        human_message,
        assistant_message
    ])

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        output_key="answer"
    )

    return ConversationalRetrievalChain.from_llm(
        llm=chat_model,
        retriever=vector_store.as_retriever(
            search_kwargs={"k": 3}  # Limit to top 3 most relevant chunks
        ),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": chat_prompt},
        chain_type="stuff",
        get_chat_history=format_chat_history,
        return_source_documents=True,
        verbose=True
    )

def format_chat_history(chat_history):
    formatted_history = []
    for message in chat_history:
        if isinstance(message, HumanMessage):
            formatted_history.append(f"<|im_start|>user\n{message.content}<|im_end|>")
        elif isinstance(message, AIMessage):
            formatted_history.append(f"<|im_start|>assistant\n{message.content}<|im_end|>")
    return "\n".join(formatted_history)

@app.post("/add_document")
async def add_document(document: DocumentInput):
    """Add a document to the vector store"""
    try:
        # Extract conversation_id from metadata
        conversation_id = document.metadata.get("conversation_id", "default")
        
        # Clear any existing data for this conversation
        clear_conversation_data(conversation_id)
        
        # Create new vector store for this conversation
        vector_store = get_or_create_vector_store(conversation_id)
        
        # Process and add document
        doc = Document(page_content=document.content, metadata=document.metadata or {})
        text_splitter = CharacterTextSplitter(
            chunk_size=1000,  # Reduced chunk size for better context
            chunk_overlap=100,  # Added overlap to maintain context between chunks
            separator="\n"
        )
        docs = text_splitter.split_documents([doc])
        
        # Add documents to vector store
        vector_store.add_documents(docs)
        # vector_store.persist()
        
        return {"message": "Document added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-text/")
async def extract_text(file: UploadFile = File(...)):
    try:
        os.makedirs("temp", exist_ok=True)
        # Save the uploaded file to a temporary location
        file_location = f"temp/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())

        # Create a DocumentReader instance and extract text
        reader = DocumentReader(file_location)
        text = reader.extract_text()

        # Clean up the temporary file
        os.remove(file_location)

        return JSONResponse(content={"text": text})

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Chat with the RAG chatbot"""
    try:
        # Get or create vector store for this conversation
        vector_store = get_or_create_vector_store(message.conversation_id)
        
        # Get or create conversation chain
        if message.conversation_id not in conversation_chains:
            conversation_chains[message.conversation_id] = create_rag_chain_with_memory(
                vector_store, message.conversation_id
            )
        
        chain = conversation_chains[message.conversation_id]
        
        # Get response
        response = chain({"question": message.query})
        
        # Clean up the answer
        answer = response.get("answer", "I couldn't find an answer.")
        clean_answer = answer.replace("<|im_start|>assistant\n", "").replace("<|im_end|>", "").strip()
        
        # Format sources
        sources = [
            f"Page {doc.metadata.get('page', 'unknown')} - {doc.page_content[:100]}..."
            for doc in response.get("source_documents", [])
        ]
        
        return ChatResponse(
            answer=clean_answer,
            conversation_id=message.conversation_id,
            sources=sources
        )
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation and its associated data"""
    try:
        clear_conversation_data(conversation_id)
        return {"message": f"Conversation {conversation_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)