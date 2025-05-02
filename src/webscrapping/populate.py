import json
import os 
import dotenv
import sys
import mysql.connector

sys.path.insert(0,"../vectorization")
import vectorization as vect

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

def find_near_preference(user):
    
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USERNAME"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_DATABASE"),
        port=int(os.getenv("DB_PORT")))

    cursor = conn.cursor()

    preferences_query = '''
        SELECT preference FROM user_preference WHERE user_id = %s 
    '''

    cursor.execute(preferences_query,(user,))

    result = cursor.fetchall()

    cursor.close()

    cursor = conn.cursor()

    pref_list = []
    for r in result:
        pref_list.append(r[0])

    vec = vect.create_embeddings_from_preferences(str(pref_list))

    cursor.execute("Set @query_vec = (%s):>VECTOR(4096)",(json.dumps(vec),))

    near_query = '''
        Select name, place_vector <*> @query_vec AS score FROM restaurant ORDER BY score DESC LIMIT 5
    '''

    cursor.execute(near_query)

    resp = cursor.fetchall()
    
    cursor.close()
    conn.close()

    print(resp)

    
        
