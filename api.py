from contextlib import asynccontextmanager
import os
import time
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
from utils import DocumentReader, parse_json

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

def handle_remove_error(func, path, exc_info):
    """Handle the PermissionError when a file is in use"""
    if not os.access(path, os.W_OK):
        time.sleep(1)
        func(path)

def clear_conversation_data(conversation_id: str):
    """Clear all data associated with a conversation and close Chroma connections"""
    if conversation_id in conversation_chains:
        del conversation_chains[conversation_id]

    if conversation_id in vector_stores:
        vector_store = vector_stores[conversation_id]
        vector_store._persist_client.close()  # Ensure the connection to the database is closed

        vector_store.delete_collection()
        del vector_stores[conversation_id]

    persist_path = os.path.join(PERSIST_DIRECTORY, conversation_id)
    if os.path.exists(persist_path):
        shutil.rmtree(persist_path, onerror=handle_remove_error)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global chat_model, embeddings
    
    chat_model = initialize_chat_ollama()
    embeddings = initialize_embeddings()
    
    os.makedirs(PERSIST_DIRECTORY, exist_ok=True)
    
    yield  
    
    for conversation_id in list(vector_stores.keys()):
        clear_conversation_data(conversation_id)  # Ensure conversation data is cleaned up

    if os.path.exists(PERSIST_DIRECTORY):
        shutil.rmtree(PERSIST_DIRECTORY, onerror=handle_remove_error)

app = FastAPI(title="Flash Notes Bot", lifespan=lifespan)

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
            search_kwargs={"k": 3} 
        ),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": chat_prompt},
        chain_type="stuff",
        get_chat_history=format_chat_history,
        return_source_documents=True,
        rephrase_question=False,
        verbose=True
    )

def format_chat_history(chat_history, max_messages=5):
    """Only keep the last 'max_messages' to avoid long token sequences."""
    truncated_history = chat_history[-max_messages:]
    formatted_history = []
    for message in truncated_history:
        if isinstance(message, HumanMessage):
            formatted_history.append(f"<|im_start|>user\n{message.content}<|im_end|>")
        elif isinstance(message, AIMessage):
            formatted_history.append(f"<|im_start|>assistant\n{message.content}<|im_end|>")
    return "\n".join(formatted_history)


@app.post("/add_document")
async def add_document(document: DocumentInput):
    """Add a document to the vector store"""
    try:
        conversation_id = document.metadata.get("conversation_id", "default")
        clear_conversation_data(conversation_id)
        vector_store = get_or_create_vector_store(conversation_id)
        
        doc = Document(page_content=document.content, metadata=document.metadata or {})
        text_splitter = CharacterTextSplitter(
            chunk_size=1000,  
            chunk_overlap=100,  
            separator="\n"
        )
        docs = text_splitter.split_documents([doc])
        vector_store.add_documents(docs)        
        return {"message": "Document added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-text/")
async def extract_text(file: UploadFile = File(...)):
    try:
        os.makedirs("temp", exist_ok=True)
        file_location = f"temp/{file.filename}"
        with open(file_location, "wb") as f:
            f.write(await file.read())

        reader = DocumentReader(file_location)
        text = reader.extract_text()

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
        vector_store = get_or_create_vector_store(message.conversation_id)
        
        if message.conversation_id not in conversation_chains:
            conversation_chains[message.conversation_id] = create_rag_chain_with_memory(
                vector_store, message.conversation_id
            )
        
        chain = conversation_chains[message.conversation_id]
        
        response = chain({"question": message.query})
        
        answer = response.get("answer", "I couldn't find an answer.")
        clean_answer = answer.replace("<|im_start|>assistant\n", "").replace("<|im_end|>", "").strip()
        
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

@app.post("/generate_quiz")
async def get_summary(document: DocumentInput):
    """Get a summary of a document"""
    try:
        system_prompt = "You are an expert assistant that creates multiple-choice questions (MCQs) from provided reference material. Extract key information and generate five MCQs, each with one correct answer and three incorrect options."

        user_prompt = f"""
        Please create five multiple-choice questions from the reference text in JSON format. Each question should have one correct answer and three incorrect options. Use the following structure:

        [
            {{
                "question": "Question 1 text...",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_option": "Option A"
            }}
        ]

        ### Example Output:

        [
            {{
                "question": "What is the capital of France?",
                "options": ["Berlin", "Madrid", "Paris", "Rome"],
                "correct_option": "Paris"
            }}
        ]

        Ensure that the questions are clear and concise, and that options are straightforward without excessive detail or ambiguity.

        Text:
        {DocumentInput.content}
        """

        full_prompt = f'''<|im_start|>system
        {system_prompt}<|im_end|>
        <|im_start|>user
        {user_prompt}<|im_end|>
        <|im_start|>assistant
        '''

        quizzes = chat_model(full_prompt)
        formatted_quizzes = parse_json(quizzes)
        return {"quiz": formatted_quizzes}
    except Exception as e:
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