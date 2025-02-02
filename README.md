
---

# Flash Notes

Flash Notes is an interactive document assistant that leverages Retrieval-Augmented Generation (RAG) to enhance user interaction with documents. It allows users to upload documents (PDF, PPTX, or TXT) and engage with them using Qwen 2.5. With Flash Notes, users can chat with their documents, generate summaries, and create quizzes based on the content, all designed to enhance document comprehension and learning.

## Features
- **Chat with Documents**: Ask questions directly about your documents and receive accurate, context-aware responses.
- **Summarize Content**: Generate concise summaries of key points.
- **Generate Quizzes**: Automatically create quizzes to test knowledge of the document content.
- **RAG (Retrieval-Augmented Generation)**: Utilizes RAG to improve response relevance by retrieving document-specific context before generating responses.
- **OCR for Image-Based Text**: Extracts text from images within documents using Tesseract OCR.

## Tech Stack
- **Frontend**: Next.js
- **Backend**: FastAPI
- **LLM**: Qwen 2.5 for natural language processing
- **RAG**: Enhances the LLM’s responses with document-based retrieval
- **Database**: IndexDB

---

## Getting Started

### Prerequisites
- **Python 3.10+** for the FastAPI backend
- **Node.js** for the Next.js frontend
- **Ollama** for the LLM model deployment
- **Tesseract OCR** for extracting text from images within documents (download link below)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Nawap1/FlashNotes.git
cd FlashNotes
```

#### 2. Download the Quantized Model

- Download the Qwen 2.5 model from [this link](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf?download=true).
- Place the downloaded model file in a new directory named `/Model` within the project root.

#### 3. Install Ollama

- Download and install Ollama from [here](https://ollama.com/), following the installation instructions provided.

#### 4. Install Tesseract OCR (For Image-Based Text Extraction)

- Download Tesseract OCR from [this link](https://sourceforge.net/projects/tesseract-ocr-alt/files/tesseract-ocr-setup-3.02.02.exe/download) and follow the installation instructions.
- Once installed, ensure Tesseract is accessible in your system’s PATH.

#### 5. Prepare the Model

1. Copy the downloaded model file into the project directory.
2. Create a file named `Modelfile` in the same directory with the following content:

   ```text
   FROM qwen2.5-3b-instruct-q4_k_m.gguf
   SYSTEM You are a helpful AI assistant
   # Adjust model parameters
   PARAMETER temperature 0.7
   PARAMETER top_k 40
   PARAMETER top_p 0.95
   PARAMETER num_ctx 10000
   ```

3. Create the Ollama model by running:

   ```bash
   ollama create qwen3 -f Modelfile
   ```

#### 6. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

---

## Running the Application

### 1. Start the API

1. Navigate to the API directory:

   ```bash
   cd api
   ```

2. Run the API:

   ```bash
   python api.py
   ```

   The API will now be running at `http://localhost:8000`.

### 2. Start the Frontend

1. Navigate to the app directory:

   ```bash
   cd app
   ```

2. Install frontend dependencies:

   ```bash
   npm install
   ```

3. Start the frontend server:

   ```bash
   npx next dev
   ```

   The app should now be accessible at `http://localhost:3000`.

---

## Usage

1. Open your browser and go to `http://localhost:3000`.
2. Use the **Upload** button to upload your documents.
3. Once loaded, interact with your document in the following ways:
   - **Chat**: Navigate to the chat section to ask questions about the document.
   - **Summarize**: Go to the summary tab and click **Generate Summary** for key takeaways.
   - **Quiz**: Go to the quiz tab and click **Generate Quiz** to create questions based on the document content.
   - **OCR for Images**: If your document contains images with text, the system will use Tesseract OCR to extract and process the text.

---
## Demo

https://github.com/user-attachments/assets/0a2ba9d2-5eed-40db-9833-83f311540d45


