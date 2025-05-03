import asyncio
import json
import logging
import websockets
from urllib.parse import parse_qs
import jwt
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("websocket_server")

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
PORT = int(os.getenv("WS_PORT", "8765"))
HOST = os.getenv("WS_HOST", "0.0.0.0")

# In-memory state
active_connections = {}  # {client_id: websocket}
group_members = {}       # {group_code: {username: websocket}}
group_restaurants = {}   # {group_code: {restaurant_id: [usernames who liked]}}


async def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("sub")  # Username
    except jwt.PyJWTError as e:
        logger.error(f"Token verification error: {e}")
        return None


async def broadcast_to_group(group_code, message):
    """Send a message to all members of a group"""
    if group_code in group_members:
        for username, websocket in group_members[group_code].items():
            try:
                await websocket.send(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending to {username}: {e}")


async def check_for_match(group_code, restaurant_id, restaurant_name=""):
    """Check if all members of a group liked the same restaurant"""
    if group_code not in group_members or group_code not in group_restaurants:
        return
    
    total_members = len(group_members[group_code])
    
    # If nobody in group (edge case)
    if total_members == 0:
        return
    
    # If restaurant hasn't been liked by anyone
    if restaurant_id not in group_restaurants[group_code]:
        return
    
    liked_by = group_restaurants[group_code][restaurant_id]
    
    # Check if all group members liked this restaurant
    if len(liked_by) == total_members and total_members >= 2:
        logger.info(f"MATCH FOUND in group {group_code} for restaurant {restaurant_id}!")
        
        # Send match notification to all members
        await broadcast_to_group(group_code, {
            "type": "restaurant_match",
            "data": {
                "restaurant_id": restaurant_id,
                "restaurant_name": restaurant_name,
                "group_code": group_code,
                "message": "You've found a match!"
            }
        })


async def handle_join_group(websocket, data, username):
    """Handle a user joining a group"""
    group_code = data.get("group_code")
    if not group_code:
        return
    
    # Initialize group structures if needed
    if group_code not in group_members:
        group_members[group_code] = {}
    if group_code not in group_restaurants:
        group_restaurants[group_code] = {}
    
    # Add user to the group
    group_members[group_code][username] = websocket
    
    logger.info(f"User {username} joined group {group_code}")
    logger.info(f"Group {group_code} now has {len(group_members[group_code])} members")
    
    # Notify others that user joined
    await broadcast_to_group(group_code, {
        "type": "user_joined",
        "data": {
            "username": username,
            "name": data.get("name", username),
            "group_code": group_code
        }
    })


async def handle_leave_group(websocket, data, username):
    """Handle a user leaving a group"""
    group_code = data.get("group_code")
    if not group_code or group_code not in group_members:
        return
    
    # Remove user from group
    if username in group_members[group_code]:
        del group_members[group_code][username]
        logger.info(f"User {username} left group {group_code}")
    
    # If group is empty, clean up
    if len(group_members[group_code]) == 0:
        del group_members[group_code]
        if group_code in group_restaurants:
            del group_restaurants[group_code]
        logger.info(f"Group {group_code} is now empty and removed")
    else:
        # Notify others that user left
        await broadcast_to_group(group_code, {
            "type": "member_left",
            "data": {
                "username": username,
                "name": data.get("name", username),
                "group_code": group_code,
                "message": f"{data.get('name', username)} has left the group"
            }
        })


async def handle_restaurant_vote(websocket, data, username):
    """Handle a user voting on a restaurant"""
    group_code = data.get("group_code")
    restaurant_id = data.get("restaurant_id")
    restaurant_name = data.get("restaurant_name", "")
    liked = data.get("liked", False)
    
    if not group_code or not restaurant_id:
        return
    
    # Ensure group exists in our data structures
    if group_code not in group_members or group_code not in group_restaurants:
        return
    
    # Initialize restaurant in group if needed
    if restaurant_id not in group_restaurants[group_code]:
        group_restaurants[group_code][restaurant_id] = []
    
    # Update likes based on vote
    likes = group_restaurants[group_code][restaurant_id]
    
    if liked and username not in likes:
        # Add user to likes
        likes.append(username)
        logger.info(f"User {username} liked restaurant {restaurant_id} ({restaurant_name}) in group {group_code}")
    elif not liked and username in likes:
        # Remove user from likes
        likes.remove(username)
        logger.info(f"User {username} removed like from restaurant {restaurant_id} ({restaurant_name}) in group {group_code}")
    
    # Broadcast vote to all group members
    await broadcast_to_group(group_code, {
        "type": "restaurant_vote",
        "data": data
    })
    
    # Check if this created a match
    if liked:
        await check_for_match(group_code, restaurant_id, restaurant_name)


async def handle_message(websocket, message, username):
    """Process incoming websocket messages"""
    try:
        data = json.loads(message)
        message_type = data.get("type")
        message_data = data.get("data", {})
        
        if message_type == "join_group":
            await handle_join_group(websocket, message_data, username)
        elif message_type == "leave_group":
            await handle_leave_group(websocket, message_data, username)
        elif message_type == "restaurant_vote":
            await handle_restaurant_vote(websocket, message_data, username)
        elif message_type == "group_dissolved_by_host":
            # Forward dissolution event to all members
            group_code = message_data.get("group_code")
            if group_code:
                await broadcast_to_group(group_code, {
                    "type": "group_dissolved",
                    "data": {
                        "message": message_data.get("message", "The host has dissolved the group"),
                        "redirect": True,
                        "group_code": group_code
                    }
                })
        elif message_type == "restaurant_match":
            # Just forward the match notification to all members
            group_code = message_data.get("group_code")
            restaurant_id = message_data.get("restaurant_id")
            if group_code and restaurant_id:
                await broadcast_to_group(group_code, {
                    "type": "restaurant_match",
                    "data": message_data
                })
        elif message_type == "reset_selection":
            # Handle selection reset
            group_code = message_data.get("group_code")
            username = message_data.get("username")
            name = message_data.get("name", username)
            
            if group_code and group_code in group_restaurants:
                # Reset all restaurant likes for this group
                for restaurant_id in group_restaurants[group_code]:
                    group_restaurants[group_code][restaurant_id] = []
                
                logger.info(f"Selection reset by {username} for group {group_code}")
                
                # Notify all members about the reset
                await broadcast_to_group(group_code, {
                    "type": "selection_reset",
                    "data": {
                        "group_code": group_code,
                        "username": username,
                        "name": name
                    }
                })
        else:
            logger.warning(f"Unknown message type: {message_type}")
    
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON received: {message}")
    except Exception as e:
        logger.error(f"Error handling message: {e}")


async def remove_user_from_all_groups(username):
    """Remove a user from all groups they joined"""
    groups_to_clean = []
    
    # Find all groups the user is in
    for group_code, members in group_members.items():
        if username in members:
            # Get user's websocket before removing them
            websocket = members[username]
            
            # Create leave data to reuse the leave handler
            leave_data = {
                "group_code": group_code,
                "username": username
            }
            
            # Use the existing leave group handler
            await handle_leave_group(websocket, leave_data, username)
            
            # If group is now empty, mark for cleanup
            if group_code in group_members and len(group_members[group_code]) == 0:
                groups_to_clean.append(group_code)
    
    # Clean up empty groups
    for group_code in groups_to_clean:
        if group_code in group_members:
            del group_members[group_code]
        if group_code in group_restaurants:
            del group_restaurants[group_code]
        logger.info(f"Removed empty group {group_code}")


# Updated handler function for newer websockets versions
async def websocket_handler(websocket):
    """Handle WebSocket connections"""
    # Get query parameters from the URI (via different method for newer websockets)
    # In recent websockets library versions, connection details are in request_headers
    try:
        # First try to get from request_uri
        if hasattr(websocket, 'request_uri'):
            uri = websocket.request_uri
            
        # Then try to get from path_and_query
        elif hasattr(websocket, 'path') and websocket.path:
            uri = websocket.path
        # Try from raw_path (if it exists)
        elif hasattr(websocket, 'raw_path'):
            uri = websocket.raw_path.decode('utf-8')
        # Finally try from the request attribute
        elif hasattr(websocket, 'request') and hasattr(websocket.request, 'path'):
            uri = websocket.request.path
        else:
            # Fallback to just using the query string directly if available
            uri = ''
            if hasattr(websocket, 'request') and hasattr(websocket.request, 'query_string'):
                query_string = websocket.request.query_string.decode('utf-8')
            else:
                query_string = ''
    except Exception as e:
        logger.error(f"Error accessing URI: {e}")
        uri = ''
        query_string = ''
    
    # Extract query parameters
    if '?' in uri:
        query_string = uri.split('?', 1)[1]
    else:
        query_string = ''
    
    query_params = parse_qs(query_string)
    
    # Debug log to see what we have
    logger.info(f"Connection URI: {uri}")
    logger.info(f"Query string: {query_string}")
    logger.info(f"Query params: {query_params}")
    
    token = query_params.get('token', [''])[0]
    group_code = query_params.get('group', [''])[0]
    
    # Verify token and get username
    username = await verify_token(token)
    
    if not username:
        logger.warning("Authentication failed - closing connection")
        await websocket.close(1008, "Authentication failed")
        return
    
    # Register connection
    client_id = id(websocket)
    active_connections[client_id] = websocket
    logger.info(f"New connection: {client_id} (username: {username})")
    
    # If group code was provided in URL, automatically join that group
    if group_code:
        await handle_join_group(websocket, {"group_code": group_code, "username": username}, username)
    
    try:
        async for message in websocket:
            await handle_message(websocket, message, username)
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Connection closed: {client_id} (username: {username})")
    finally:
        # Clean up when connection closes
        if client_id in active_connections:
            del active_connections[client_id]
        
        # Remove user from all groups
        await remove_user_from_all_groups(username)


async def status_reporter():
    """Periodically log status information"""
    while True:
        logger.info(f"Active connections: {len(active_connections)}")
        logger.info(f"Active groups: {len(group_members)}")
        
        for group_code, members in group_members.items():
            logger.info(f"Group {group_code}: {len(members)} members")
            if group_code in group_restaurants:
                for restaurant_id, likes in group_restaurants[group_code].items():
                    logger.info(f"  Restaurant {restaurant_id}: {len(likes)} likes")
        
        await asyncio.sleep(60)


async def main():
    """Start the WebSocket server"""
    # Start the status reporter
    asyncio.create_task(status_reporter())
    
    # Start the WebSocket server with the updated handler signature
    async with websockets.serve(websocket_handler, HOST, PORT, ping_interval=30):
        logger.info(f"WebSocket server started on {HOST}:{PORT}")
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    asyncio.run(main())