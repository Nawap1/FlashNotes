
---

# Flash Notes

Flash Notes is an interactive document assistant that allows users to upload documents (PDF, PPTX, or TXT) and engage with them using Qwen 2.5. With Flash Notes, users can chat with their documents, generate summaries, and create quizzes based on the content, all designed to enhance document comprehension and learning.

## Features
- **Chat with Documents**: Ask questions directly about your documents and receive accurate, context-aware responses.
- **Summarize Content**: Generate concise summaries of key points.
- **Generate Quizzes**: Automatically create quizzes to test knowledge of the document content.

## Tech Stack
- **Frontend**: Next.js
- **Backend**: FastAPI
- **LLM**: Qwen 2.5 for natural language processing
- **Database**: IndexDB

---

## Getting Started

### Prerequisites
- **Python 3.8+** for the FastAPI backend
- **Node.js** for the Next.js frontend
- **Ollama** for the LLM model deployment

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

#### 4. Prepare the Model

1. Copy the downloaded model file into the project directory.
2. Create a file named `Modelfile` in the same directory with the following content:

   ```text
   FROM qwen2.5-3b-instruct-q4_k_m.gguf
   SYSTEM You are a helpful AI assistant
   # Adjust model parameters
   PARAMETER temperature 0.7
   PARAMETER top_k 40
   PARAMETER top_p 0.95
   ```

3. Create the Ollama model by running:

   ```bash
   ollama create qwen3 -f Modelfile
   ```

#### 5. Install Backend Dependencies

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

---

## License
This project is licensed under the MIT License.