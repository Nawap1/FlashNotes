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
from langchain.schema import Document, AIMessage, HumanMessage, SystemMessage
from langchain.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate, AIMessagePromptTemplate

chat_model = None
embeddings = None
vector_store = None
conversation_chains = {}

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    global chat_model, embeddings, vector_store
    chat_model = initialize_chat_ollama()
    embeddings = initialize_embeddings()
    vector_store = Chroma(embedding_function=embeddings, collection_name="chatbot_docs")
    yield
    vector_store.delete_collection()
    conversation_chains.clear()

app = FastAPI(title="Flash Notes Bot", lifespan=lifespan)

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

def format_chat_history(chat_history):
    formatted_history = []
    for message in chat_history:
        if isinstance(message, HumanMessage):
            formatted_history.append(f"<|im_start|>user\n{message.content}<|im_end|>")
        elif isinstance(message, AIMessage):
            formatted_history.append(f"<|im_start|>assistant\n{message.content}<|im_end|>")
    return "\n".join(formatted_history)

def create_rag_chain_with_memory(chat_model, vector_store, conversation_id):
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
        retriever=vector_store.as_retriever(),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": chat_prompt},
        chain_type="stuff",
        get_chat_history=format_chat_history,
        return_source_documents=True,
        verbose=True
    )

def get_response_from_chain(chain, query):
    try:
        # Format the query if needed
        formatted_query = query
        if not query.startswith("<|im_start|>"):
            formatted_query = f"<|im_start|>user\n{query}<|im_end|>"
            
        response = chain.invoke({"question": formatted_query})
        answer = response.get("answer", "I couldn't find an answer.")
        
        # Ensure the answer has the proper tokens
        if not answer.startswith("<|im_start|>"):
            answer = f"<|im_start|>assistant\n{answer}<|im_end|>"
            
        source_documents = response.get("source_documents", [])
        return answer, source_documents
    except Exception as e:
        print(f"Error in get_response_from_chain: {str(e)}")
        return "<|im_start|>assistant\nI encountered an error while processing your request.<|im_end|>", []

@app.post("/add_document")
async def add_document(document: DocumentInput):
    """Add a document to the vector store"""
    global vector_store
    try:
        doc = Document(page_content=document.content, metadata=document.metadata or {})
        text_splitter = CharacterTextSplitter(chunk_size=10000, chunk_overlap=0)
        docs = text_splitter.split_documents([doc])
        vector_store = Chroma.from_documents(
            documents=docs,
            embedding=embeddings,
            collection_name="chatbot_docs",
            persist_directory="/db"
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
        answer, source_documents = get_response_from_chain(chain, message.query)
        
        # Clean up the answer by removing the tokens for the response
        clean_answer = answer.replace("<|im_start|>assistant\n", "").replace("<|im_end|>", "").strip()
        
        sources = [
            f"{doc.metadata.get('source', 'unknown')} - {doc.page_content[:100]}..."
            for doc in source_documents
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
    """Delete a conversation and its memory"""
    if conversation_id in conversation_chains:
        del conversation_chains[conversation_id]
        return {"message": f"Conversation {conversation_id} deleted successfully"}
    raise HTTPException(status_code=404, detail="Conversation not found")

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)