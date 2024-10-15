from langchain_community.llms import Ollama
from langchain_core.callbacks import CallbackManager, StreamingStdOutCallbackHandler
from load import *

def initialize_llm():
    callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])
    return Ollama(base_url="http://localhost:11434", model="qwen3", callback_manager=callback_manager)

def generate_multiple_choice_questions(text,llm):

    system_prompt = "You are a highly knowledgeable assistant specializing in generating educational multiple-choice questions (MCQs) from provided reference material. Your goal is to analyze key points, extract essential information, and create five multiple-choice questions. Each question must be well-structured, clear, and relevant to the text, with one correct answer and three plausible distractors. The focus should be on assessing comprehension, critical thinking, and retention of the material."

    user_prompt = f"""
    Please create five multiple-choice questions from the provided reference text. Each question should have one correct answer and three incorrect options.
    Strucutre:
    **Question**  
    **A.** Option 1  
    **B.** Option 2  
    **C.** Option 3  
    **D.** Option 4  
    **Correct Answer:** A/B/C/D

    Example:
    **Question 1:** What is the capital of France?  
    **A.** Berlin  
    **B.** Madrid  
    **C.** Paris  
    **D.** Rome  
    **Correct Answer:** C
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
    # Generate questions
    raw_response = llm(full_prompt)
    return raw_response


def generate_json(raw_response, llm):

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