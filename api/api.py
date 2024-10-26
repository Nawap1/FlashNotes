from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from models import *
from services import *

# Global variables
chat_model: Optional[ChatOllama] = None
embeddings: Optional[OllamaEmbeddings] = None
vector_store: Optional[Chroma] = None
conversation_chain: Optional[ConversationalRetrievalChain] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global chat_model, embeddings, vector_store, conversation_chain
    
    # Startup
    chat_model = initialize_chat_ollama()
    embeddings = initialize_embeddings()
    vector_store = initialize_vector_store(embeddings)
    conversation_chain = create_rag_chain_with_memory(vector_store, chat_model)
    
    yield
    
    # Shutdown
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
    try:
        global vector_store, conversation_chain
        
        if vector_store:
            vector_store._client.reset()
            vector_store = initialize_vector_store(embeddings)
            conversation_chain = create_rag_chain_with_memory(vector_store, chat_model)
        
        all_docs = process_documents(documents.documents)
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
    try:
        prompt = generate_quiz_prompt(document.content)
        response = chat_model.invoke(prompt)
        content = response.content
        
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
    try:
        text_splitter = TokenTextSplitter(chunk_size=10000, chunk_overlap=200)
        texts = text_splitter.split_text(document.content)
        docs = [Document(page_content=t) for t in texts]

        map_prompt, refine_prompt = get_summary_prompts()

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

        response = summarize_chain.invoke({"input_documents": docs})
        summary = response['output_text'].strip()

        return {"summary": summary}

    except Exception as e:
        print(f"Error in summary generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)