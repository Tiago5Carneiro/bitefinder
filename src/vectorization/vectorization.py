import os
import json
from time import sleep
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

    return response.data[0].embedding

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

def gemini_generate_text(prompt):
    response = None
    while response == None:
        try: 
            response = gemini_client.models.generate_text(
                model="gemini-2.0-flash",
                prompt=prompt
            )
        except:
            print(f"sleeping {prompt}")
            sleep(61)
    return response

def text_from_user_food_preferences(preferences):
    prompt = f"""
    You are a perceptive and imaginative assistant that transforms food preferences into vivid, sensory-rich descriptions.
    
    Based on the following user preferences: {preferences}
    
    Write a short, evocative description (between 50 and 100 words) that brings a dish to life. Describe the food’s style (e.g., rustic, gourmet, playful), its mood and vibe (e.g., comforting, bold, elegant), and its colourfulness and texture. Use expressive, flavorful language—as if writing for a food magazine or setting the scene in a culinary story.
    """
    response = gemini_generate_text(prompt)

    return response.text

def text_from_user_restaurant_preferences(preferences):
    prompt = f"""
    You are a helpful and imaginative assistant that interprets restaurant preferences and transforms them into vivid descriptions.
    
    Based on the following user preferences: {preferences}
    
    Write a concise and evocative description (between 50 and 100 words) that captures the restaurant’s style, colour theme, mood, and overall vibe. Use rich, sensory language to bring the atmosphere to life, as if describing the setting of a scene in a novel.
    """

    response = gemini_generate_text(prompt)

    return response.text

def gemini_generate_text_from_image(image,prompt):
    response = None

    while response == None:
        try: 
            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[image, prompt]
            )
        except:
            print(f"sleeping {prompt}")
            sleep(61)
    return response

def detect_image_type(image):
    prompt ="""
    You are a helpful assistant that can analyze images.

    IMPORTANT: Your response must ONLY contain a single digit number:
    - If the image provided is a photo of a restaurant: respond with ONLY "0"
    - If the image provided is a photo of food: respond with ONLY "1"
    
    Do not include any explanation, bounding boxes, JSON, or other text in your response.
    """
    response = gemini_generate_text_from_image(image,prompt)

    return response.text

def text_from_restaurant_image(image):
    prompt ="""
You will be shown an image of a restaurant. Based on the visual elements in the image, provide a concise description 
(between 50 and 100 words) that captures the restaurant’s style, colour palette, overall mood, and atmosphere or vibe. 
Focus on architectural and decorative details, lighting, furniture, and any other cues that help convey its character.
    """
    response = gemini_generate_text_from_image(image,prompt)

    return response.text

def text_from_food_image(image):
    prompt ="""
Look closely at this image of a menu item and craft a vivid, sensory-rich description (50–100 words). 
Describe the food’s style—is it rustic, gourmet, street-style, or avant-garde? Reflect on its mood and personality—playful, elegant, comforting, bold? 
Comment on its colourfulness, texture, and overall vibe, as if you're painting a picture with words for someone who’s never seen or tasted it. Make the dish come alive through your description.
    """
    response = gemini_generate_text_from_image(image,prompt)

    return response.text

def create_image_text(path, url = 0):
    if url == 1:
        image = url_to_image(path)
    else :
        image = path_to_image(path)
    food_type = int(detect_image_type(image))
    print(food_type)
    ret = (None,None)
    if food_type == 0:
        ret = (0,text_from_restaurant_image(image))
    elif food_type == 1:
        ret = (1,text_from_food_image(image))
        
    return ret

def create_embeddings_file(path):
    starting_gemini_client()
    starting_mistral_client()

    f = open(path,"r")
    data = json.load(f)

    ret_dic = {}

    for ind_p in data:
        if data[ind_p]["primaryType"] in ["shopping_mall","hotel","cultural_center"]:
            pass

        place = data[ind_p]
        food_t = ""
        food_v = None
        restaurant_t = ""
        restaurant_v = None

        for image_ind in range(min(len(place["photos"]),4)):
            if(food_v and restaurant_v):
                pass

            image_url = place["photos"][image_ind]
            image_type, text = create_image_text(image_url,1)

            if image_type == 1 and food_v == None:
                food_t = text
                food_v = creating_embeddings_from_text(text)
            elif image_type == 0 and restaurant_v == None:
                restaurant_t = text
                restaurant_v = creating_embeddings_from_text(text)

        ret_dic[ind_p] = {"foodVector": food_v, "restaurantVector": restaurant_v, "foodText":food_t, "restaurantText":restaurant_t}

    f.close()
    f = open(path + "_vec","w")
    f.write(json.dumps(ret_dic))
    f.close()

def create_embeddings_from_preferences(preferences):
    starting_mistral_client()
    response = text_from_user_restaurant_preferences(preferences)
    restaurant_vector = creating_embeddings_from_text(response)
    return restaurant_vector