from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
from datetime import datetime, timedelta
import jwt

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['DATA_DIR'] = os.path.join(os.path.dirname(os.path.dirname(__file__)))

# Data storage files
USERS_FILE = 'users.json'
RATINGS_FILE = 'ratings.json'
COMMENTS_FILE = 'comments.json'
FAVORITES_FILE = 'favorites.json'
SEARCH_HISTORY_FILE = 'search_history.json'

# Initialize data files if they don't exist
def init_data_file(filename, default_data=None):
    filepath = os.path.join(app.config['DATA_DIR'], 'backend', filename)
    if not os.path.exists(filepath):
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(default_data if default_data is not None else {}, f, ensure_ascii=False, indent=2)

init_data_file(USERS_FILE, {})
init_data_file(RATINGS_FILE, {})
init_data_file(COMMENTS_FILE, {})
init_data_file(FAVORITES_FILE, {})
init_data_file(SEARCH_HISTORY_FILE, {})

# Helper functions
def load_json(filename):
    filepath = os.path.join(app.config['DATA_DIR'], 'backend', filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

def save_json(filename, data):
    filepath = os.path.join(app.config['DATA_DIR'], 'backend', filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

# Routes

# Get property data
@app.route('/api/properties', methods=['GET'])
def get_properties():
    try:
        filepath = os.path.join(app.config['DATA_DIR'], 'data.json')
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User Registration
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email và password là bắt buộc'}), 400
    
    users = load_json(USERS_FILE)
    
    # Check if user exists
    if email in users:
        return jsonify({'error': 'Email đã được đăng ký'}), 400
    
    # Create new user
    users[email] = {
        'email': email,
        'username': username or email.split('@')[0],
        'password': generate_password_hash(password),
        'created_at': datetime.utcnow().isoformat()
    }
    
    save_json(USERS_FILE, users)
    
    token = generate_token(email)
    return jsonify({
        'message': 'Đăng ký thành công',
        'token': token,
        'user': {
            'email': email,
            'username': users[email]['username']
        }
    }), 201

# User Login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email_or_username = data.get('email')
    password = data.get('password')
    
    if not email_or_username or not password:
        return jsonify({'error': 'Email/username và password là bắt buộc'}), 400
    
    users = load_json(USERS_FILE)
    
    # Find user by email or username
    user = None
    user_email = None
    for email, user_data in users.items():
        if email == email_or_username or user_data.get('username') == email_or_username:
            user = user_data
            user_email = email
            break
    
    if not user:
        return jsonify({'error': 'Thông tin đăng nhập không đúng'}), 401
    
    # Verify password
    if not check_password_hash(user['password'], password):
        return jsonify({'error': 'Thông tin đăng nhập không đúng'}), 401
    
    token = generate_token(user_email)
    return jsonify({
        'message': 'Đăng nhập thành công',
        'token': token,
        'user': {
            'email': user_email,
            'username': user['username']
        }
    }), 200

# Get ratings for a property
@app.route('/api/ratings/<property_id>', methods=['GET'])
def get_ratings(property_id):
    ratings = load_json(RATINGS_FILE)
    property_ratings = ratings.get(property_id, [])
    
    if not property_ratings:
        return jsonify({'average': 0, 'count': 0, 'ratings': []}), 200
    
    total = sum(r['rating'] for r in property_ratings)
    average = total / len(property_ratings)
    
    return jsonify({
        'average': round(average, 1),
        'count': len(property_ratings),
        'ratings': property_ratings
    }), 200

# Add or update rating
@app.route('/api/ratings/<property_id>', methods=['POST'])
def add_rating(property_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    rating = data.get('rating')
    
    if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({'error': 'Rating phải từ 1 đến 5'}), 400
    
    ratings = load_json(RATINGS_FILE)
    
    if property_id not in ratings:
        ratings[property_id] = []
    
    # Check if user already rated
    user_rating = next((r for r in ratings[property_id] if r['user_id'] == user_id), None)
    
    if user_rating:
        user_rating['rating'] = rating
        user_rating['updated_at'] = datetime.utcnow().isoformat()
    else:
        ratings[property_id].append({
            'user_id': user_id,
            'rating': rating,
            'created_at': datetime.utcnow().isoformat()
        })
    
    save_json(RATINGS_FILE, ratings)
    
    return jsonify({'message': 'Đánh giá thành công'}), 200

# Get comments for a property
@app.route('/api/comments/<property_id>', methods=['GET'])
def get_comments(property_id):
    comments = load_json(COMMENTS_FILE)
    property_comments = comments.get(property_id, [])
    
    # Get user info for each comment
    users = load_json(USERS_FILE)
    for comment in property_comments:
        user = users.get(comment['user_id'], {})
        comment['username'] = user.get('username', 'Anonymous')
    
    return jsonify(property_comments), 200

# Add comment
@app.route('/api/comments/<property_id>', methods=['POST'])
def add_comment(property_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    text = data.get('text', '').strip()
    rating = data.get('rating', 0)
    
    if not text:
        return jsonify({'error': 'Comment không được để trống'}), 400
    
    comments = load_json(COMMENTS_FILE)
    
    if property_id not in comments:
        comments[property_id] = []
    
    users = load_json(USERS_FILE)
    user = users.get(user_id, {})
    
    new_comment = {
        'user_id': user_id,
        'username': user.get('username', 'Anonymous'),
        'text': text,
        'rating': rating,
        'created_at': datetime.utcnow().isoformat()
    }
    
    comments[property_id].append(new_comment)
    save_json(COMMENTS_FILE, comments)
    
    return jsonify(new_comment), 201

# Get user favorites
@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    favorites = load_json(FAVORITES_FILE)
    user_favorites = favorites.get(user_id, [])
    
    return jsonify(user_favorites), 200

# Add to favorites
@app.route('/api/favorites/<property_id>', methods=['POST'])
def add_favorite(property_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    favorites = load_json(FAVORITES_FILE)
    
    if user_id not in favorites:
        favorites[user_id] = []
    
    if property_id not in favorites[user_id]:
        favorites[user_id].append(property_id)
        save_json(FAVORITES_FILE, favorites)
        return jsonify({'message': 'Đã thêm vào yêu thích'}), 200
    
    return jsonify({'message': 'Đã có trong danh sách yêu thích'}), 200

# Remove from favorites
@app.route('/api/favorites/<property_id>', methods=['DELETE'])
def remove_favorite(property_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    favorites = load_json(FAVORITES_FILE)
    
    if user_id in favorites and property_id in favorites[user_id]:
        favorites[user_id].remove(property_id)
        save_json(FAVORITES_FILE, favorites)
        return jsonify({'message': 'Đã xóa khỏi yêu thích'}), 200
    
    return jsonify({'message': 'Không tìm thấy trong danh sách yêu thích'}), 404

# Get search history
@app.route('/api/search-history', methods=['GET'])
def get_search_history():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    history = load_json(SEARCH_HISTORY_FILE)
    user_history = history.get(user_id, [])
    
    return jsonify(user_history), 200

# Add to search history
@app.route('/api/search-history', methods=['POST'])
def add_search_history():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    search_data = {
        'type': data.get('type'),
        'area': data.get('area'),
        'keyword': data.get('keyword'),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    history = load_json(SEARCH_HISTORY_FILE)
    
    if user_id not in history:
        history[user_id] = []
    
    # Add to beginning and limit to 50 items
    history[user_id].insert(0, search_data)
    history[user_id] = history[user_id][:50]
    
    save_json(SEARCH_HISTORY_FILE, history)
    
    return jsonify({'message': 'Đã lưu lịch sử tìm kiếm'}), 200

# Serve static files (for development)
@app.route('/')
def serve_index():
    return send_from_directory(app.config['DATA_DIR'], 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.config['DATA_DIR'], path)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
