from contextlib import asynccontextmanager
import os
from typing import List, Optional
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
import chromadb
from models import ChatMessage, ChatResponse, DocumentInput
from config import *
from utils import parse_json, DocumentReader

def initialize_chat_ollama():
    return ChatOllama(
        base_url=OLLAMA_BASE_URL,
        model=OLLAMA_MODEL,
        callbacks=[StreamingStdOutCallbackHandler()]
    )

def initialize_embeddings():
    return OllamaEmbeddings(
        base_url=OLLAMA_BASE_URL,
        model=OLLAMA_MODEL
    )

def initialize_vector_store(embeddings) -> Chroma:
    client = chromadb.Client(settings=chromadb.Settings(
        is_persistent=False,
        allow_reset=True
    ))
    
    return Chroma(
        client=client,
        embedding_function=embeddings,
        collection_name=VECTOR_STORE_COLLECTION
    )

def create_rag_chain_with_memory(vector_store: Chroma, chat_model) -> ConversationalRetrievalChain:
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
    truncated_history = chat_history[-max_messages:]
    formatted_history = []
    for message in truncated_history:
        if isinstance(message, HumanMessage):
            formatted_history.append(f"<|im_start|>user\n{message.content}<|im_end|>")
        elif isinstance(message, AIMessage):
            formatted_history.append(f"<|im_start|>assistant\n{message.content}<|im_end|>")
    return "\n".join(formatted_history)

def process_documents(documents: List[DocumentInput]) -> List[Document]:
    text_splitter = CharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separator="\n"
    )
    
    all_docs = []
    for doc_input in documents:
        doc = Document(
            page_content=doc_input.content,
            metadata=doc_input.metadata or {}
        )
        split_docs = text_splitter.split_documents([doc])
        all_docs.extend(split_docs)
    return all_docs

def generate_quiz_prompt(content: str) -> str:
    return f"""<|im_start|>system
    You are an expert at creating multiple choice questions. Generate questions based on the given text and return them in JSON format only.
    <|im_end|>
    <|im_start|>user
    Create 5 multiple choice questions from this text. Return only a JSON array with no additional text or explanation.
    Each question must have these exact fields: "question", "options" (array of 4 choices), and "correct_option".

    Text to analyze: {content}
    <|im_end|>
    <|im_start|>assistant"""

def get_summary_prompts():
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
    
    return (
        ChatPromptTemplate.from_template(map_template),
        ChatPromptTemplate.from_template(refine_template)
    )