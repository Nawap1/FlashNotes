from langchain_community.llms import Ollama
from langchain_core.callbacks import CallbackManager, StreamingStdOutCallbackHandler
from load import *

def initialize_llm():
    callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])
    return Ollama(base_url="http://localhost:11434", model="qwen3", callback_manager=callback_manager)

def generate_multiple_choice_questions(text,llm):

    system_prompt = "You are an expert assistant that generates multiple-choice questions from reference presentations in PDF or TXT format. Your task is to extract the key information and create five multiple-choice questions based on it. Only five in numerical Order"

    user_prompt = f"""
    Please create five multiple-choice questions from the provided reference text. Each question should have one correct answer and three incorrect options.

    Use the following structure:
    "Question 1"
    "Option A"
    "Option B"
    "Option C"
    "Option D"
    "Correct Ans"

    "Question 2"
    "Option A"
    "Option B"
    "Option C"
    "Option D"
    "Correct Ans"
    
    "Question 3"
    "Option A"
    "Option B"
    "Option C"
    "Option D"
    "Correct Ans"

    "Question 4"
    "Option A"
    "Option B"
    "Option C"
    "Option D"
    "Correct Ans"

    "Question 5"
    "Option A"
    "Option B"
    "Option C"
    "Option D"
    "Correct Ans"

    Ensure that the questions are clear and concise, and that options are straightforward without excessive detail or ambiguity.

    Text:
    {text}
    """

    full_prompt = f'''<|im_start|>system
    {system_prompt}<|im_end|>
    <|im_start|>user
    {user_prompt}<|im_end|>
    <|im_start|>assistant
    '''
    raw_response = llm(full_prompt)

    # Generate questions
    raw_response = llm(full_prompt)
    return raw_response


def generate_json(raw_response, llm):

    system_prompt = "You are an expert assistant that generates multiple-choice questions from reference presentations in PDF or TXT format. Your task is to extract the key information and create five multiple-choice questions based on it."

    user_prompt = f"""
    Please create five multiple-choice questions from the provided reference text in JSON format. Each question should have one correct answer and three incorrect options. Structure the output as follows:

    [
        {{
            "question no": "1",  
            "question": "Question ...",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "correct_option": "Option A"  // specify the correct option here
        }},
        {{
            "question no": "2",
            "question": "Question ...",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "correct_option": "Option B"
        }},
        {{
            "question no": "3",
            "question": "Question ...",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "correct_option": "Option C"
        }},
        {{
            "question no": "4",
            "question": "Question ...",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "correct_option": "Option D"
        }},
        {{
            "question no": "5",
            "question": "Question ...",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "correct_option": "Option A"
        }}
    ]

    Ensure that the questions are clear and concise, and that options are straightforward without excessive detail or ambiguity.

    Text:
    {raw_response}
    """

    full_prompt = f'''<|im_start|>system
    {system_prompt}<|im_end|>
    <|im_start|>user
    {user_prompt}<|im_end|>
    <|im_start|>assistant
    '''
    json_response = llm(full_prompt)
    return json_response

def extract_json(file_path):
    llm = initialize_llm()
    extracted_text = read_file(file_path)
    raw_response = generate_multiple_choice_questions(extracted_text,llm)
    return generate_json(raw_response,llm)