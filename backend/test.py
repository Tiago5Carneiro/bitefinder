import requests
import json

BASE_URL = "http://localhost:5000"

def test_register():
    url = f"{BASE_URL}/register"
    data = {
        "username": "testuser2",
        "name": "Test User 2",
        "email": "test2@example.com",
        "password": "password123"
    }
    response = requests.post(url, json=data)
    print(f"Register: {response.status_code}")
    print(response.json())
    return response.json()

def test_login():
    url = f"{BASE_URL}/login"
    data = {
        "username": "testuser2",
        "password": "password123"
    }
    response = requests.post(url, json=data)
    print(f"Login: {response.status_code}")
    print(response.json())
    return response.json()

def test_create_group(token, username):
    url = f"{BASE_URL}/groups/create"
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "name": "Test Group",
        "username": username
    }
    response = requests.post(url, json=data, headers=headers)
    print(f"Create Group: {response.status_code}")
    print(response.json())
    return response.json()

def test_add_restaurant():
    url = f"{BASE_URL}/restaurants"
    data = {
        "name": "Test Restaurant",
        "rating": 4.5,
        "url_location": "https://maps.google.com/test",
        "image_urls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
    }
    response = requests.post(url, json=data)
    print(f"Add Restaurant: {response.status_code}")
    print(response.json())
    return response.json()

def test_get_restaurants():
    url = f"{BASE_URL}/restaurants"
    response = requests.get(url)
    print(f"Get Restaurants: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    return response.json()

def run_tests():
    # Register new user
    test_register()
    
    # Login with new user
    login_response = test_login()
    if 'token' in login_response:
        token = login_response['token']
        username = login_response['user']['username']
        
        # Test group creation
        test_create_group(token, username)
        
    # Test restaurant endpoints
    test_add_restaurant()
    test_get_restaurants()

if __name__ == "__main__":
    run_tests()