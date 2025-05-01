import os
from openai import OpenAI
from PIL import Image
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

mistral_client = None
gemini_client = None

def starting_mistral_client():
    global mistral_client
    # Access the variables
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")


    mistral_client = OpenAI(
        api_key=api_key,
        base_url=api_base
    )


    response = mistral_client.embeddings.create(
        input="Hello world",
        model="Linq-AI-Research/Linq-Embed-Mistral"
    )

    print(response.data[0].embedding)

def starting_gemini_client():
    from google import genai
    global gemini_client
    api_key = os.getenv("GEMINI_API_KEY")
    gemini_client = genai.Client(api_key=api_key)

def text_from_image():
    image = Image.open("Old_violin.jpg")
    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[image, "Tell me about this instrument"]
    )
    print(response.text)

starting_gemini_client()
text_from_image()