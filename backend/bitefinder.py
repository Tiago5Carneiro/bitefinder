import mysql.connector
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt
import jwt
import datetime
import random
import string
from flask_socketio import SocketIO, join_room, leave_room, emit

# Load environment variables
load_dotenv()

def get_db_connection():
    """Establish connection to SingleStore database"""
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USERNAME"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_DATABASE"),
        port=int(os.getenv("DB_PORT"))
    )
    return conn

#drop all tables
def drop_all_tables():
    """Drop all tables in the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("DROP TABLE IF EXISTS user_preference")
        cursor.execute("DROP TABLE IF EXISTS user_restaurant")
        cursor.execute("DROP TABLE IF EXISTS restaurant_image")
        cursor.execute("DROP TABLE IF EXISTS group_user")
        cursor.execute("DROP TABLE IF EXISTS `group`")
        cursor.execute("DROP TABLE IF EXISTS restaurant")
        cursor.execute("DROP TABLE IF EXISTS user")
        cursor.execute("DROP TABLE IF EXISTS photo")
        
        conn.commit()
        print("All tables dropped successfully")
        
    except Exception as e:
        print(f"Error dropping tables: {e}")
        conn.rollback()
        
    finally:
        cursor.close()
        conn.close()
# Uncomment the line below to drop all tables before initializing
# drop_all_tables()

def init_db():
    """Initialize database tables if they don't exist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create user table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user (
            username VARCHAR(100) PRIMARY KEY,
            name VARCHAR(80) NOT NULL,
            password VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL
        )
        ''')
        
        # Create restaurant table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS restaurant (
            restaurant_id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            rating FLOAT NOT NULL,
            url_location VARCHAR(255) NOT NULL,
            food_vector VECTOR(4096),
            place_vector VECTOR(4096),
            price_range_max INT NOT NULL,
            price_range_min INT NOT NULL,
            price_level INT NOT NULL,
            type VARCHAR(100) NOT NULL,
            reservable BOOLEAN NOT NULL,
            vegetarian BOOLEAN NOT NULL,
            summary VARCHAR(500) NOT NULL
        )
        ''')

        # Create Scheduale table 
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS scheduale (
            id INT AUTO_INCREMENT PRIMARY KEY,
            end VARCHAR(20) NOT NULL,
            start VARCHAR(20) NOT NULL,
            day VARCHAR(10) NOT NULL,
            restaurant_id VARCHAR(100) NOT NULL
        )
        ''')

        # Create photo table 
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS photo (
            url VARCHAR(500) PRIMARY KEY,
            restaurant_id VARCHAR(100) NOT NULL
        )
        ''')
        
        # Create group table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS `group` (
            code VARCHAR(10) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            status ENUM('active', 'inactive') NOT NULL,
            creator_username VARCHAR(100) NOT NULL,
            max_members INT DEFAULT 6,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create group_user table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS group_user (
            group_code VARCHAR(10),
            username VARCHAR(100),
            is_ready BOOLEAN DEFAULT FALSE,
            PRIMARY KEY (group_code, username)
        )
        ''')
        
        # Create user_restaurant table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_restaurant (
            username VARCHAR(100),
            restaurant_id INT,
            PRIMARY KEY (username, restaurant_id)
        )
        ''')
        
        # Create user_preference table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_preference (
            username VARCHAR(100),
            preference VARCHAR(100),
            PRIMARY KEY (username,preference)
        )
        ''')
        
        conn.commit()
        print("Database tables created successfully")
        
    except Exception as e:
        print(f"Error creating tables: {e}")
        conn.rollback()
        
    finally:
        cursor.close()
        conn.close()

# Add this right after defining the app
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize database tables
init_db()

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")  # Change in production
JWT_EXPIRATION_DAYS = 7


# Add WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join_group')
def handle_join_group(data):
    room = data['group_code']
    join_room(room)
    print(f'Client joined room: {room}')

@socketio.on('leave_group')
def handle_leave_group(data):
    room = data['group_code']
    leave_room(room)
    print(f'Client left room: {room}')

# Helper functions
def hash_password(password):
    """Hash a password for storage"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(stored_password, provided_password):
    """Verify a stored password against one provided by user"""
    return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password.encode('utf-8'))

def generate_token(username):
    """Generate a JWT token"""
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=JWT_EXPIRATION_DAYS),
        'iat': datetime.datetime.utcnow(),
        'sub': username
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def generate_group_code():
    """Generate a unique 6-character group code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# USER AUTHENTICATION ENDPOINTS
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Basic validation
    if not all(k in data for k in ('username', 'name', 'email', 'password')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    username = data['username']
    name = data['name']
    email = data['email']
    password = data['password']
    
    place_preferences = data.get('place_preferences', [])
    food_preferences = data.get('food_preferences', [])
    
    # Hash the password
    hashed_password = hash_password(password)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if user already exists
        cursor.execute("SELECT username FROM user WHERE username = %s OR email = %s", (username, email))
        if cursor.fetchone():
            return jsonify({'error': 'Username or email already registered'}), 409
        
        # Insert new user
        cursor.execute(
            "INSERT INTO user (username, name, password, email) VALUES (%s, %s, %s, %s)",
            (username, name, hashed_password, email)
        )
        for place_preference in place_preferences:
            cursor.execute(
                "INSERT INTO user_preference (username, preference) VALUES (%s, %s)",
                (username, place_preference)
            )
        
        for food_preference in food_preferences:
            cursor.execute(
                "INSERT INTO user_preference (username, preference) VALUES (%s, %s)",
                (username, food_preference)
            )

        conn.commit()
        
        return jsonify({'message': 'User registered successfully'}), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Allow login with username or email
    if not (('username' in data or 'email' in data) and 'password' in data):
        return jsonify({'error': 'Missing login credentials'}), 400
    
    password = data['password']
    login_field = 'username' if 'username' in data else 'email'
    login_value = data[login_field]
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get user by username or email
        query = f"SELECT username, name, email, password FROM user WHERE {login_field} = %s"
        cursor.execute(query, (login_value,))
        user = cursor.fetchone()
        
        if not user or not verify_password(user['password'], password):
            return jsonify({'error': 'Invalid credentials'}), 401

        cursor.execute(
            "SELECT preference FROM user_preference WHERE username = %s",
            (user['username'],)
        )
        preferences = [row['preference'] for row in cursor.fetchall()]

        # Generate token
        token = generate_token(user['username'])
        
        return jsonify({
            'token': token,
            'user': {
                'username': user['username'],
                'name': user['name'],
                'email': user['email'],
                'preferences': preferences
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

# GROUP MANAGEMENT ENDPOINTS
@app.route('/groups/create', methods=['POST'])
def create_group():
    data = request.get_json()
    
    if not all(k in data for k in ('name', 'username')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    name = data['name']
    username = data['username']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Validate that user exists
        cursor.execute("SELECT username FROM user WHERE username = %s", (username,))
        if not cursor.fetchone():
            return jsonify({'error': 'User not found'}), 404
        
        # Generate a unique group code (ensure it doesn't already exist)
        code = generate_group_code()
        cursor.execute("SELECT code FROM `group` WHERE code = %s", (code,))
        while cursor.fetchone():
            code = generate_group_code()
            cursor.execute("SELECT code FROM `group` WHERE code = %s", (code,))
        
        # Create the group
        cursor.execute(
            "INSERT INTO `group` (code, name, status, creator_username) VALUES (%s, %s, 'active', %s)",
            (code, name, username)
        )
        

        # Quando adicionar o criador ao grupo, marcá-lo como pronto por padrão
        cursor.execute(
            "INSERT INTO group_user (group_code, username, is_ready) VALUES (%s, %s, TRUE)",
            (code, username)
        )
        
        conn.commit()
        
        return jsonify({
            'message': 'Group created successfully',
            'code': code,
            'name': name

        }), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

# Update the join_group route
@app.route('/groups/join', methods=['POST'])
def join_group():
    data = request.get_json()
    
    if not all(k in data for k in ('code', 'username')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    code = data['code']
    username = data['username']
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Validate that user exists
        cursor.execute("SELECT name FROM user WHERE username = %s", (username,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if the group exists and is active
        cursor.execute("SELECT * FROM `group` WHERE code = %s AND status = 'active'", (code,))
        group = cursor.fetchone()
        
        if not group:
            return jsonify({'error': 'Group not found or inactive'}), 404
        
        # Check if user is already in the group
        cursor.execute("SELECT * FROM group_user WHERE group_code = %s AND username = %s", (code, username))
        if cursor.fetchone():
            return jsonify({'error': 'User already in this group'}), 409
        
        # Add user to the group
        cursor.execute(
            "INSERT INTO group_user (group_code, username) VALUES (%s, %s)",
            (code, username)
        )
        
        # Notify others via WebSocket that user joined
        user_name = user['name']
        socketio.emit('user_joined', {
            'username': username,
            'name': user_name,
            'message': f"{user_name} has joined the group"
        }, room=code)
        
        # Get updated member list
        cursor.execute("""
            SELECT u.username, u.name, gu.is_ready, 
                (u.username = g.creator_username) as is_host
            FROM user u
            JOIN group_user gu ON u.username = gu.username
            JOIN `group` g ON gu.group_code = g.code
            WHERE gu.group_code = %s
        """, (code,))
        
        # Format members consistently
        members = []
        for row in cursor.fetchall():
            members.append({
                'username': row['username'],
                'name': row['name'],
                'is_ready': bool(row['is_ready']),
                'is_host': bool(row['is_host'])
            })
        
        # Emit updated member list
        socketio.emit('members_update', {'members': members}, room=code)
        
        conn.commit()
        
        return jsonify({
            'message': 'Joined group successfully',
            'group': {
                'code': group['code'],
                'name': group['name']
            }
        }), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

# Endpoint to get user info and preferences
@app.route('/user/<username>', methods=['GET'])
def get_user(username):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get user info
        cursor.execute("SELECT username, name, email FROM user WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user preferences
        cursor.execute(
            "SELECT preference FROM user_preference WHERE username = %s",
            (username,)
        )
        preferences = [row['preference'] for row in cursor.fetchall()]
        user['preferences'] = preferences
        
        return jsonify({'user': user}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

@app.route('/groups/user/<username>', methods=['GET'])
def get_user_groups(username):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Validate that user exists
        cursor.execute("SELECT username FROM user WHERE username = %s", (username,))
        if not cursor.fetchone():
            return jsonify({'error': 'User not found'}), 404
            
        cursor.execute("""
            SELECT g.code, g.name, g.status, g.created_at
            FROM `group` g
            JOIN group_user gu ON g.code = gu.group_code
            WHERE gu.username = %s AND g.status = 'active'
        """, (username,))
        
        groups = cursor.fetchall()
        
        return jsonify({'groups': groups}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

# RESTAURANT ENDPOINTS
@app.route('/restaurants', methods=['GET'])
def get_restaurants():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM restaurant")
        restaurants = cursor.fetchall()
        
        # Get images for each restaurant
        for restaurant in restaurants:
            restaurant_id = restaurant['restaurant_id']  # Changed from 'id' to 'restaurant_id'
            cursor.execute("SELECT image_url FROM restaurant_image WHERE restaurant_id = %s", (restaurant_id,))
            images = cursor.fetchall()
            restaurant['images'] = [img['image_url'] for img in images]
            restaurant['rating'] = float(restaurant['rating'])  # Convert Decimal to float for JSON
        
        return jsonify({'restaurants': restaurants}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()


@app.route('/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT username, name, email FROM user")
        users = cursor.fetchall()
        
        for user in users:
            cursor.execute(
                "SELECT preference FROM user_preference WHERE username = %s",
                (user['username'],)
            )
            preferences = [row['preference'] for row in cursor.fetchall()]
            user['preferences'] = preferences

        return jsonify({'users': users}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

# RESTAURANT MANAGEMENT ENDPOINTS
@app.route('/restaurants', methods=['POST'])
def add_restaurant():
    data = request.get_json()
    
    if not all(k in data for k in ('restaurant_id', 'name', 'rating', 'url_location')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    restaurant_id = data['restaurant_id']
    name = data['name']
    rating = data['rating']
    url_location = data['url_location']
    image_urls = data.get('image_urls', [])
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Add restaurant
        cursor.execute("""
            INSERT INTO restaurant (restaurant_id, name, rating, url_location)
            VALUES (%s, %s, %s, %s)
        """, (restaurant_id, name, rating, url_location))
        
        # Add images
        for image_url in image_urls:
            cursor.execute("""
                INSERT INTO restaurant_image (restaurant_id, image_url)
                VALUES (%s, %s)
            """, (restaurant_id, image_url))
        
        conn.commit()
        
        return jsonify({
            'message': 'Restaurant added successfully',
            'restaurant_id': restaurant_id,  # Changed from 'id' to 'restaurant_id'
        }), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

@app.route('/groups/<code>/members', methods=['GET'])
def get_group_members(code):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if the group exists
        cursor.execute("SELECT * FROM `group` WHERE code = %s", (code,))
        group = cursor.fetchone()
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
        
        # Get all members of the group with their ready status
        cursor.execute("""
            SELECT u.username, u.name, gu.is_ready, 
                   (u.username = g.creator_username) as is_host
            FROM user u
            JOIN group_user gu ON u.username = gu.username
            JOIN `group` g ON gu.group_code = g.code
            WHERE gu.group_code = %s
        """, (code,))
        
        members = cursor.fetchall()
        
        return jsonify({'members': members}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

# Endpoint para pegar informações do grupo
@app.route('/groups/<code>', methods=['GET'])
def get_group(code):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if the group exists
        cursor.execute("SELECT * FROM `group` WHERE code = %s", (code,))
        group = cursor.fetchone()
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
            
        # Incluir o criador do grupo na resposta
        return jsonify({'group': group}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

# Endpoint para marcar-se como pronto ou não pronto
@app.route('/groups/<code>/ready', methods=['POST'])
def update_ready_status(code):
    data = request.get_json()
    
    if not all(k in data for k in ('username', 'is_ready')):
        return jsonify({'error': 'Missing required fields'}), 400
        
    username = data['username']
    is_ready = data['is_ready']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Update ready status
        cursor.execute(
            "UPDATE group_user SET is_ready = %s WHERE group_code = %s AND username = %s",
            (is_ready, code, username)
        )
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'User not found in group'}), 404
            
        conn.commit()
        
        cursor.execute("""
            SELECT u.username, u.name, gu.is_ready, 
                (u.username = g.creator_username) as is_host
            FROM user u
            JOIN group_user gu ON u.username = gu.username
            JOIN `group` g ON gu.group_code = g.code
            WHERE gu.group_code = %s
        """, (code,))
        
        # Ensure consistent format for members data
        members = []
        for row in cursor.fetchall():
            members.append({
                'username': row[0],  # or row['username'] if using dictionary cursor
                'name': row[1],      # or row['name']
                'is_ready': bool(row[2]),  # Convert to boolean
                'is_host': bool(row[3])    # Convert to boolean
            })
        
        # Emit update to all clients in the group room
        socketio.emit('members_update', {'members': members}, room=code)
    
        
        return jsonify({'success': True, 'is_ready': is_ready}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
        
    finally:
        cursor.close()
        conn.close()

@app.route('/groups/<code>/leave', methods=['POST'])
def leave_group(code):
    data = request.get_json()
    
    if 'username' not in data:
        return jsonify({'error': 'Missing username'}), 400
        
    username = data['username']
    is_host = data.get('is_host', False)
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if the group exists
        cursor.execute("SELECT * FROM `group` WHERE code = %s", (code,))
        group = cursor.fetchone()
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
            
        # Check if user is in the group
        cursor.execute(
            "SELECT * FROM group_user WHERE group_code = %s AND username = %s", 
            (code, username)
        )
        
        if not cursor.fetchone():
            return jsonify({'error': 'User not in group'}), 404
            
        # Check if user is the host/creator
        is_creator = (group['creator_username'] == username)
        
        if is_creator or is_host:
            # If the user is the creator, mark the group as inactive
            cursor.execute(
                "UPDATE `group` SET status = 'inactive' WHERE code = %s",
                (code,)
            )
            
            # Notify all clients in the group to redirect to home
            socketio.emit('group_dissolved', {
                'message': 'The host has dissolved the group'
            }, room=code)
            
            # Don't call leave_room here - it's an HTTP request
        else:
            # Get user details for notification
            cursor.execute("SELECT name FROM user WHERE username = %s", (username,))
            user = cursor.fetchone()
            user_name = user.get('name', username) if user else username
            
            # Remove the user from the group
            cursor.execute(
                "DELETE FROM group_user WHERE group_code = %s AND username = %s",
                (code, username)
            )
            
            # Notify other members that someone left
            socketio.emit('member_left', {
                'username': username,
                'name': user_name,
                'message': f"{user_name} has left the group"
            }, room=code)
            
            # Don't call leave_room here - it's an HTTP request
            
            # Get updated member list
            cursor.execute("""
                SELECT u.username, u.name, gu.is_ready, 
                    (u.username = g.creator_username) as is_host
                FROM user u
                JOIN group_user gu ON u.username = gu.username
                JOIN `group` g ON gu.group_code = g.code
                WHERE gu.group_code = %s
            """, (code,))
            
            # Format members consistently
            members = []
            for row in cursor.fetchall():
                members.append({
                    'username': row['username'],
                    'name': row['name'],
                    'is_ready': bool(row['is_ready']),
                    'is_host': bool(row['is_host'])
                })
            
            # Emit updated member list
            socketio.emit('members_update', {'members': members}, room=code)
            
        conn.commit()
        
        return jsonify({'message': 'Successfully left group'}), 200
        
    except Exception as e:
        conn.rollback()
        print(f"Error in leave_group: {str(e)}")
        return jsonify({'error': str(e)}), 500
        
    finally:
        cursor.close()
        conn.close()
        
# Add a new endpoint to update group status explicitly
@app.route('/groups/<code>/status', methods=['POST'])
def update_group_status(code):
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({'error': 'Missing status'}), 400
        
    status = data['status']
    if status not in ['active', 'inactive']:
        return jsonify({'error': 'Invalid status value'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Update group status
        cursor.execute(
            "UPDATE `group` SET status = %s WHERE code = %s",
            (status, code)
        )
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Group not found'}), 404
            
        conn.commit()
        
        # Notify clients about status change
        socketio.emit('group_status_update', {'status': status}, room=code)
        
        return jsonify({'message': f'Group status updated to {status}'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
        
    finally:
        cursor.close()
        conn.close()


# Endpoint para iniciar a seleção de restaurantes
@app.route('/groups/<code>/start', methods=['POST'])
def start_restaurant_selection(code):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if the group exists
        cursor.execute("SELECT * FROM `group` WHERE code = %s", (code,))
        group = cursor.fetchone()
        
        if not group:
            return jsonify({'error': 'Group not found'}), 404
            
        # Check if all members are ready
        cursor.execute(
            "SELECT COUNT(*) as total, SUM(is_ready) as ready FROM group_user WHERE group_code = %s",
            (code,)
        )
        
        result = cursor.fetchone()
        
        if result['total'] == 0 or result['ready'] < result['total']:
            return jsonify({'error': 'Not all members are ready'}), 400
            
        # Update group status to "selecting"
        cursor.execute(
            "UPDATE `group` SET status = 'selecting' WHERE code = %s",
            (code,)
        )
        
        conn.commit()
        
        return jsonify({'message': 'Restaurant selection started'}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
        
    finally:
        cursor.close()
        conn.close()

# Endpoint to add user preferences
@app.route('/user/<username>/preferences', methods=['GET'])
def get_user_preferences(username):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Validate user exists
        cursor.execute("SELECT username FROM user WHERE username = %s", (username,))
        if not cursor.fetchone():
            return jsonify({'error': 'User not found'}), 404
        
        cursor.execute(
            "SELECT preference FROM user_preference WHERE username = %s",
            (username,)
        )
        
        preferences = [row['preference'] for row in cursor.fetchall()]
        
        return jsonify({'preferences': preferences}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

# Endpoint to update user preferences
@app.route('/user/<username>/preferences', methods=['POST'])
def update_user_preferences(username):
    data = request.get_json()
    
    if 'preferences' not in data:
        return jsonify({'error': 'Missing preferences'}), 400
    
    preferences = data['preferences']
    if not isinstance(preferences, list):
        return jsonify({'error': 'Preferences must be a list'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Validate user exists
        cursor.execute("SELECT username FROM user WHERE username = %s", (username,))
        if not cursor.fetchone():
            return jsonify({'error': 'User not found'}), 404
        
        # Delete existing preferences
        cursor.execute("DELETE FROM user_preference WHERE username = %s", (username,))
        
        # Insert new preferences
        for preference in preferences:
            cursor.execute(
                "INSERT INTO user_preference (username, preference) VALUES (%s, %s)",
                (username, preference)
            )
        
        conn.commit()
        
        return jsonify({'message': 'Preferences updated successfully'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

# Endpoint to update user profile
@app.route('/user/<username>/profile', methods=['POST'])
def update_user_profile(username):
    data = request.get_json()
    
    # Check for required fields
    if not data or not any(k in data for k in ('name', 'email')):
        return jsonify({'error': 'No profile data provided'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Validate user exists
        cursor.execute("SELECT username FROM user WHERE username = %s", (username,))
        if not cursor.fetchone():
            return jsonify({'error': 'User not found'}), 404
        
        # Build update query dynamically based on provided fields
        update_fields = []
        update_values = []
        
        if 'name' in data and data['name']:
            update_fields.append("name = %s")
            update_values.append(data['name'])
            
        if 'email' in data and data['email']:
            update_fields.append("email = %s")
            update_values.append(data['email'])
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Add username to values for WHERE clause
        update_values.append(username)
        
        # Execute update
        query = f"UPDATE user SET {', '.join(update_fields)} WHERE username = %s"
        cursor.execute(query, update_values)
        
        conn.commit()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)