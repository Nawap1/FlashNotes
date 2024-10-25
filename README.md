# Flash Notes

Flash Notes is an interactive document assistant that allows users to upload documents (PDF, PPTX, or TXT) and interact with them using Qwen 2.5. With Flash Notes, you can chat with your document, generate concise summaries, and even create quizzes based on the content.

## Features
- **Chat with Documents**: Ask questions about your documents and get accurate responses.
- **Summarize Content**: Quickly generate summaries to capture key points.
- **Generate Quizzes**: Automatically create quizzes to test knowledge of the document content.

## Tech Stack
- **Frontend**: Next.js
- **Backend**: FastAPI
- **LLM**: Qwen 2.5 for NLP capabilities
- **Database**: IndexDB

## Getting Started

### Prerequisites
1. **Python 3.8+** for the FastAPI backend.
2. **Node.js** for the Next.js frontend.
3. **Ollama** for the LLM deployment
### Installation

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Nawap1/FlashNotes.git
```

### 2. Download the Quantized Model

- Navigate to [this link](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf?download=true) and download the **qwen2.5-3b-instruct-q4_k_m.gguf** model.
- Create a directory `/Model` in the project root and place the downloaded quantized model inside.

### 3. Install Ollama

- Download Ollama from [here](https://ollama.com/).
- Install Ollama following the provided instructions.

### 4. Prepare the Model

- Copy the downloaded model file into the project directory.
- Create a file named `Modelfile` in the same directory and paste the following content:

```text
FROM qwen2.5-3b-instruct-q4_k_m.gguf
SYSTEM You are a helpful AI assistant
# Adjust model parameters
PARAMETER temperature 0.7
PARAMETER top_k 40
PARAMETER top_p 0.95
```

### 5. Create the Ollama Model

Open a terminal and run the following command:

```bash
ollama create qwen3 -f Modelfile
```

### 6. Install Python Dependencies

```bash
pip install -r requirements.txt
```

## Running the API

1. Navigate to the API directory:

```bash
cd api
```

2. Start the API:

```bash
python api.py
```

The API should now be running on `http://localhost:8000`.

## Hosting the YouTube Summarizer App

1. Navigate to the app directory:

```bash
cd app
```

2. Install frontend dependencies:

```bash
npm install
```

3. Run the app:

```bash
npm run dev
```

The app should now be accessible at `http://localhost:3000`.

## Usage

1. Open your web browser and go to `http://localhost:3000`.
2. Upload your documents using the upload button.
3. Then to chat wait for the documents to load and chat with your documents.
4. To generate summary, go to the summary tab and press the generate summary button
5. To generate quiz, go to quiz tab and press the generate quiz button.
