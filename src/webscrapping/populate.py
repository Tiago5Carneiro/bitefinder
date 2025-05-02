import json
import os 
import dotenv
import mysql.connector

dotenv.load_dotenv()


def load_file_db(path):

    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USERNAME"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_DATABASE"),
        port=int(os.getenv("DB_PORT")))

    file = open(path,"r")
    file_vec = open(path + "_vec","r")
    data = json.load(file)
    data_vec = json.load(file_vec)

    for key in data:
        place = data[key]

        if place["primaryType"] in ["shopping_mall","hotel","cultural_center"]:
            pass

        place_query = '''
            INSERT INTO restaurant (restaurant_id,name,rating,url_location,food_vector,place_vector,price_range_max,price_range_min,price_level,
type,reservable,vegetarian,summary)  
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)     
        '''
        
        if data_vec[key]["restaurantVector"] == None:
            data_vec[key]["restaurantVector"] = [0]*4096

        if data_vec[key]["foodVector"] == None:
            data_vec[key]["foodVector"] = [0]*4096

        cursor = conn.cursor()
        cursor.execute(place_query,(
                       key,
                       place["displayName"],
                       place["rating"],
                       place["mapsURI"],
                       json.dumps(data_vec[key]["foodVector"]),
                       json.dumps(data_vec[key]["restaurantVector"]),
                       place["priceRange"]["end"],
                       place["priceRange"]["start"],
                       place["priceLevel"],
                       place["primaryType"],
                       place["reservable"],
                       place["vegetarian"],
                       place["summary"])
                       )
        conn.commit() 
        cursor.close()


        photo_query = '''
            INSERT INTO photo (url,restaurant_id) 
            VALUES (%s,%s)     
        '''

        for photo in place["photos"]:
            cursor = conn.cursor()
            cursor.execute(photo_query,(photo,key))
            conn.commit()
            cursor.close()

    conn.close()

        
