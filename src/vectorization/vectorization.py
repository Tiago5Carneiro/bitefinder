import os
from PIL import Image
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

mistral_client = None
gemini_client = None

test_url = "https://www.pingodoce.pt/wp-content/uploads/2017/09/francesinha.jpg"
text_restauraunt_url = "https://lh3.googleusercontent.com/places/ANXAkqEIETZdepNjyZOvea4HrXuaiH4YyZlV3nEDksvNIfuzAK8uN3PIeRnrSyPDPfu6Cw1xvXov6OHB_WlbIn7I9vTleXvgo6ZdFhU=s4800-h3164"
def starting_mistral_client():
    from openai import OpenAI
    global mistral_client

    # Access the variables
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")

    # Creating client with OpenAI package
    mistral_client = OpenAI(
        api_key=api_key,
        base_url=api_base
    )

def creating_embeddings_from_text(input):

    # Generating embeddings from input
    response = mistral_client.embeddings.create(
        input=input,
        model="Linq-AI-Research/Linq-Embed-Mistral"
    )

    print(response.data[0].embedding)

    return response

def starting_gemini_client():
    from google import genai
    global gemini_client
    api_key = os.getenv("GEMINI_API_KEY")
    gemini_client = genai.Client(api_key=api_key)

def url_to_image(url):
    from io import BytesIO
    import requests

    image_from_url = requests.get(url)
    image = Image.open(BytesIO(image_from_url.content))
    return image

def path_to_image(path):
    image = Image.open(path)
    return image

def detect_image_type(image):
    prompt ="""
    Tell me if this image is an image of a restaurant or food.

    The output must follow the following rules, and provide only this info:
    0 - if the image is a restaurant
    1 - if the image is food
    """
    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[image, prompt]
    )
    return response.text

def text_from_restaurant_image(image):
    prompt ="""
    Here is an image of a restaurant, I want you to give me a brief description (between 50 to 100) of this restaurants style,
    colour theme, mood and vibe.
    """
    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[image, prompt]
    )
    print(response.text)

def text_from_food_image(image):
    prompt ="""
    Here is an image of a menu item, I want you to give me a brief description (between 50 to 100) of this food's style,
    , mood, colourfullness and vibe.
    """
    response = gemini_client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[image, prompt]
    )
    print(response.text)

def create_image_text(url):
    image = url_to_image(test_url)
    food_type = int(detect_image_type(image))
    if food_type == 0:
        text_from_restaurant_image(image)
    elif food_type ==1:
        text_from_food_image(image)

starting_gemini_client()

create_image_text(test_url)
create_image_text(text_restauraunt_url)

#starting_mistral_client()
#creating_embeddings_from_text("The Time Out Market Lisbon embodies an industrial-chic aesthetic with its exposed metal framework, high ceilings, and minimalist lighting fixtures. A mix of wood tables and neutral-toned chairs creates a communal dining atmosphere. The ambiance is lively and bustling, filled with the sounds of conversations and culinary activity. It feels modern and cosmopolitan, with a focus on food experiences and social interaction.")
