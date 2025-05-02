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
    Here is an image of a restaurant, I want you to give me a brief description (between 50 to 100) of this restaurants style,
    colour theme, mood and vibe.
    """
    response = gemini_generate_text_from_image(image,prompt)

    return response.text

def text_from_food_image(image):
    prompt ="""
    Here is an image of a menu item, I want you to give me a brief description (between 50 to 100) of this food's style,
    , mood, colourfullness and vibe.
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
        food_v = None
        restaurant_v = None

        for image_ind in range(min(len(place["photos"]),4)):
            if(food_v and restaurant_v):
                pass

            image_url = place["photos"][image_ind]
            image_type, text = create_image_text(image_url,1)

            if image_type == 1 and food_v == None:
                food_v = text_from_food_image(text)
                food_v = creating_embeddings_from_text(food_v)
            elif image_type == 0 and restaurant_v == None:
                restaurant_v = text_from_restaurant_image(text)
                restaurant_v = creating_embeddings_from_text(restaurant_v)

        ret_dic[ind_p] = {"foodVector": food_v, "restaurantVector": restaurant_v}

    f.close()
    f = open(path + "_vec","w")
    f.write(json.dumps(ret_dic))
    f.close()



#starting_gemini_client()

#create_image_text(text_restauraunt_url,1)
#create_image_text(test_url,1)


#starting_mistral_client()
#creating_embeddings_from_text("The Time Out Market Lisbon embodies an industrial-chic aesthetic with its exposed metal framework, high ceilings, and minimalist lighting fixtures. A mix of wood tables and neutral-toned chairs creates a communal dining atmosphere. The ambiance is lively and bustling, filled with the sounds of conversations and culinary activity. It feels modern and cosmopolitan, with a focus on food experiences and social interaction.")
