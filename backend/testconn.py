import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_connection():
    try:
        print("Attempting to connect to database...")
        print(f"Host: {os.getenv('DB_HOST')}")
        print(f"Port: {os.getenv('DB_PORT')}")
        print(f"User: {os.getenv('DB_USERNAME')}")
        print(f"Database: {os.getenv('DB_DATABASE')}")
        
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USERNAME"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_DATABASE"),
            port=int(os.getenv("DB_PORT"))
        )
        
        print("Connected successfully!")
        
        # Test query
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        print(f"Test query result: {result}")
        
        cursor.close()
        conn.close()
        print("Connection closed.")
        
    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    test_connection()