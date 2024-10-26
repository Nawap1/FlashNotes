from contextlib import asynccontextmanager
import os
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from langchain_core.callbacks import StreamingStdOutCallbackHandler
from langchain_community.chat_models import ChatOllama
from langchain.chains.summarize import load_summarize_chain
from langchain.text_splitter import CharacterTextSplitter, TokenTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.schema import Document, AIMessage, HumanMessage
from langchain.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate, AIMessagePromptTemplate
from utils import parse_json, DocumentReader
import chromadb

# Models
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

# Global variables
chat_model: Optional[ChatOllama] = None
embeddings: Optional[OllamaEmbeddings] = None
vector_store: Optional[Chroma] = None
conversation_chain: Optional[ConversationalRetrievalChain] = None

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

def initialize_vector_store() -> Chroma:
    """Initialize vector store with in-memory ChromaDB"""
    client = chromadb.Client(settings=chromadb.Settings(
        is_persistent=False,
        allow_reset=True
    ))
    
    return Chroma(
        client=client,
        embedding_function=embeddings,
        collection_name="chatbot_docs"
    )

# Rest of the helper functions remain the same
def create_rag_chain_with_memory(vector_store: Chroma) -> ConversationalRetrievalChain:
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
        retriever=vector_store.as_retriever(search_kwargs={"k": 3}),
        memory=memory,
        combine_docs_chain_kwargs={"prompt": chat_prompt},
        chain_type="stuff",
        get_chat_history=format_chat_history,
        return_source_documents=True,
        rephrase_question=False,
        verbose=True
    )

def format_chat_history(chat_history, max_messages=5):
    """Format chat history - implementation remains the same"""
    truncated_history = chat_history[-max_messages:]
    formatted_history = []
    for message in truncated_history:
        if isinstance(message, HumanMessage):
            formatted_history.append(f"<|im_start|>user\n{message.content}<|im_end|>")
        elif isinstance(message, AIMessage):
            formatted_history.append(f"<|im_start|>assistant\n{message.content}<|im_end|>")
    return "\n".join(formatted_history)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global chat_model, embeddings, vector_store, conversation_chain
    
    # Startup
    chat_model = initialize_chat_ollama()
    embeddings = initialize_embeddings()
    vector_store = initialize_vector_store()
    conversation_chain = create_rag_chain_with_memory(vector_store)
    
    yield
    
    # Shutdown - no need to clean up persistent directory since we're using in-memory storage
    conversation_chain = None
    vector_store = None

app = FastAPI(title="Flash Notes Bot", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/add_documents")
async def add_documents(documents: MultipleDocumentInput):
    """Add multiple documents to the vector store"""
    try:
        global vector_store, conversation_chain
        
        # Clear existing data
        if vector_store:
            vector_store._client.reset()
            vector_store = initialize_vector_store()
            conversation_chain = create_rag_chain_with_memory(vector_store)
        
        # Process all documents
        all_docs = []
        text_splitter = CharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100,
            separator="\n"
        )
        
        for doc_input in documents.documents:
            doc = Document(
                page_content=doc_input.content,
                metadata=doc_input.metadata or {}
            )
            split_docs = text_splitter.split_documents([doc])
            all_docs.extend(split_docs)
        
        # Add all documents to the vector store
        vector_store.add_documents(all_docs)
        
        return {"message": f"Successfully added {len(documents.documents)} documents"}
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
        if not conversation_chain:
            raise HTTPException(status_code=400, detail="No document loaded")
        
        response = conversation_chain({"question": message.query})
        
        answer = response.get("answer", "I couldn't find an answer.")
        clean_answer = answer.replace("<|im_start|>assistant\n", "").replace("<|im_end|>", "").strip()
        
        sources = [
            f"Page {doc.metadata.get('page', 'unknown')} - {doc.page_content[:100]}..."
            for doc in response.get("source_documents", [])
        ]
        
        return ChatResponse(
            answer=clean_answer,
            sources=sources
        )
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_quiz")
async def quiz(document: DocumentInput):
    """Generate quiz questions from a document"""
    try:
        prompt = f"""<|im_start|>system
        You are an expert at creating multiple choice questions. Generate questions based on the given text and return them in JSON format only.
        <|im_end|>
        <|im_start|>user
        Create 5 multiple choice questions from this text. Return only a JSON array with no additional text or explanation.
        Each question must have these exact fields: "question", "options" (array of 4 choices), and "correct_option".

        Text to analyze: {document.content}
        <|im_end|>
        <|im_start|>assistant
        [
            {{
                "question": "What is Python?",
                "options": ["A programming language", "An operating system", "A web browser", "A database"],
                "correct_option": "A programming language"
            }}
        ]<|im_end|>
        <|im_start|>user
        Please generate 5 questions, not just one. Use the same JSON format.
        <|im_end|>
        <|im_start|>assistant"""

        # Get response from the model
        response = chat_model.invoke(prompt)
        
        # Extract JSON from the response
        content = response.content
        
        # Find JSON array within the response
        start_idx = content.find('[')
        end_idx = content.rfind(']') + 1
        
        if start_idx != -1 and end_idx != -1:
            json_str = content[start_idx:end_idx]
            formatted_quizzes = parse_json(json_str)
            return {"quiz": formatted_quizzes}
        else:
            raise ValueError("Could not find valid JSON array in response")
            
    except Exception as e:
        print(f"Error in quiz generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summary(document: DocumentInput):
    """Generate a summary of the document"""
    try:
        text_splitter = TokenTextSplitter(chunk_size=10000, chunk_overlap=200)
        texts = text_splitter.split_text(document.content)
        docs = [Document(page_content=t) for t in texts]

        map_template = """<|im_start|>system
        You are an AI assistant specialized in understanding and concisely describing content.
        <|im_end|>
        <|im_start|>user
        Please describe the main ideas in the following content:
        {text}
        Provide a brief description of the key points.
        <|im_end|>
        <|im_start|>assistant
        """
        map_prompt = ChatPromptTemplate.from_template(map_template)

        refine_template = """<|im_start|>system
        You are an AI assistant specialized in creating concise descriptions of content.
        <|im_end|>
        <|im_start|>user
        Here's what we know about the content so far:
        {existing_answer}
        We have some new information to add:
        {text}
        Please incorporate this new information and create a single, concise paragraph that captures the main ideas of the entire content. Follow these guidelines:
        1. Focus on the most important information and key takeaways.
        2. Keep the paragraph brief, ideally 3-4 sentences.
        3. Present the information directly without mentioning that it's a description.
        4. Write in a clear, straightforward style.
        5. Avoid using meta-language or referring to the writing process.
        <|im_end|>
        <|im_start|>assistant
        """
        refine_prompt = ChatPromptTemplate.from_template(refine_template)

        summarize_chain = load_summarize_chain(
            chat_model,
            chain_type="refine",
            question_prompt=map_prompt,
            refine_prompt=refine_prompt,
            return_intermediate_steps=True,
            input_key="input_documents",
            output_key="output_text",
            verbose=True
        )

        # Run the summarization chain
        response = summarize_chain.invoke({"input_documents": docs})

        # Extract the summary from the response
        summary = response['output_text'].strip()

        return {"summary": summary}

    except Exception as e:
        print(f"Error in summary generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)