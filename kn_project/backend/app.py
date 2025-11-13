from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import re
from datetime import datetime, timedelta
import jwt
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables for API keys
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['DATA_DIR'] = os.path.join(os.path.dirname(os.path.dirname(__file__)))

# AI Configuration - Support both Gemini and OpenAI
USE_OPENAI = os.getenv('USE_OPENAI', 'false').lower() == 'true'
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Configure AI based on settings
if USE_OPENAI and OPENAI_API_KEY:
    try:
        import openai
        openai.api_key = OPENAI_API_KEY
        print('✅ OpenAI GPT configured')
    except ImportError:
        print('⚠️ WARNING: openai package not installed. Run: pip install openai')
        USE_OPENAI = False
elif GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print('✅ Gemini API configured')
else:
    print('⚠️ WARNING: No AI API key found in .env file!')

# System prompt cho chatbot phòng trọ
CHATBOT_SYSTEM_PROMPT = """Bạn là trợ lý tư vấn phòng trọ ở khu vực Hòa Lạc, Hà Nội. 
Nhiệm vụ của bạn là trả lời các câu hỏi về phòng trọ một cách thân thiện, chuyên nghiệp và chính xác.

THÔNG TIN CƠ BẢN VỀ PHÒNG TRỌ:
- Giá phòng: 1.5 - 3 triệu/tháng tùy loại phòng
- Tiện ích: WiFi miễn phí, giường, tủ, bàn học, máy giặt chung, nước nóng
- Điện nước: Điện 3,500đ/kWh, nước 100,000đ/người/tháng
- Cho phép nấu ăn trong phòng
- Gần các trường: ĐH FPT, ĐH Quốc Gia, Học Viện Kỹ Thuật Quân Sự
- Giờ giấc tự do nhưng giữ trật tự sau 22h
- Không nuôi thú cưng
- Đặt cọc 1 tháng tiền phòng
- Có điều hòa, ban công
- An ninh: Camera 24/7, khóa vân tay

QUY TẮC TRẢ LỜI:
1. Trả lời ngắn gọn, rõ ràng bằng tiếng Việt
2. Nhiệt tình, thân thiện, dùng emoji phù hợp 😊
3. Nếu không biết thông tin, hãy khuyên khách liên hệ chủ trọ
4. Luôn kết thúc bằng câu hỏi để tiếp tục hỗ trợ
5. Không bịa đặt thông tin không có trong dữ liệu trên
6. Tìm thông tin trong dữ liệu đã cho, không truy cập web ngoài nếu tìm thì tìm chính xác nguồn uy tín"""
# Data storage files
ACCOUNTS_FILE = 'accounts.json'  # Changed to accounts.json in account folder
RATINGS_FILE = 'ratings.json'
COMMENTS_FILE = 'comments.json'
FAVORITES_FILE = 'favorites.json'
SEARCH_HISTORY_FILE = 'search_history.json'

# Initialize data files if they don't exist
def init_data_file(filename, default_data=None, subfolder='backend'):
    if subfolder:
        dirpath = os.path.join(app.config['DATA_DIR'], subfolder)
        if not os.path.exists(dirpath):
            os.makedirs(dirpath, exist_ok=True)
        filepath = os.path.join(dirpath, filename)
    else:
        filepath = os.path.join(app.config['DATA_DIR'], filename)
    
    if not os.path.exists(filepath):
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(default_data if default_data is not None else {}, f, ensure_ascii=False, indent=2)

init_data_file(ACCOUNTS_FILE, {'users': {}, 'next_user_id': 1, 'next_partner_id': 1}, subfolder='account')
init_data_file(RATINGS_FILE, {})
init_data_file(COMMENTS_FILE, {})
init_data_file(FAVORITES_FILE, {})
init_data_file(SEARCH_HISTORY_FILE, {})

# Helper functions
def load_json(filename, subfolder='backend'):
    if subfolder:
        filepath = os.path.join(app.config['DATA_DIR'], subfolder, filename)
    else:
        filepath = os.path.join(app.config['DATA_DIR'], filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

def save_json(filename, data, subfolder='backend'):
    if subfolder:
        filepath = os.path.join(app.config['DATA_DIR'], subfolder, filename)
    else:
        filepath = os.path.join(app.config['DATA_DIR'], filename)
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
    account_type = data.get('account_type', 'user')  # 'user' or 'partner'
    
    if not email or not password:
        return jsonify({'error': 'Email và password là bắt buộc'}), 400
    
    accounts = load_json(ACCOUNTS_FILE, subfolder='account')
    users = accounts.get('users', {})
    
    # Check if user exists
    for user_id, user_data in users.items():
        if user_data.get('email') == email:
            return jsonify({'error': 'Email đã được đăng ký'}), 400
    
    # Generate new user ID
    if account_type == 'partner':
        next_id = accounts.get('next_partner_id', 1)
        user_id = f"partner#{str(next_id).zfill(5)}"
        accounts['next_partner_id'] = next_id + 1
    else:
        next_id = accounts.get('next_user_id', 1)
        user_id = f"user#{str(next_id).zfill(5)}"
        accounts['next_user_id'] = next_id + 1
    
    # Create new user
    users[user_id] = {
        'id': user_id,
        'email': email,
        'username': username or '',
        'password': generate_password_hash(password),
        'account_type': account_type,
        'created_at': datetime.utcnow().isoformat()
    }
    
    accounts['users'] = users
    save_json(ACCOUNTS_FILE, accounts, subfolder='account')
    
    token = generate_token(user_id)
    return jsonify({
        'message': 'Đăng ký thành công',
        'token': token,
        'user': {
            'id': user_id,
            'email': email,
            'username': username or user_id,
            'account_type': account_type
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
    
    accounts = load_json(ACCOUNTS_FILE, subfolder='account')
    users = accounts.get('users', {})
    
    # Find user by email, username, or ID
    user = None
    user_id = None
    for uid, user_data in users.items():
        if (user_data.get('email') == email_or_username or 
            user_data.get('username') == email_or_username or 
            uid == email_or_username):
            user = user_data
            user_id = uid
            break
    
    if not user:
        return jsonify({'error': 'Thông tin đăng nhập không đúng'}), 401
    
    # Verify password
    stored_pw = user.get('password', '')
    is_valid = False
    try:
        # Try hashed check first
        is_valid = check_password_hash(stored_pw, password)
    except Exception:
        is_valid = False

    # Fallback: if stored password is plaintext (manually created), compare directly
    if not is_valid:
        # Heuristic: werkzeug hashes usually start with "pbkdf2:"
        if not isinstance(stored_pw, str) or not stored_pw.startswith('pbkdf2:'):
            if stored_pw == password:
                is_valid = True
                # Auto-upgrade to hashed password and persist
                accounts = load_json(ACCOUNTS_FILE, subfolder='account')
                if 'users' in accounts and user_id in accounts['users']:
                    accounts['users'][user_id]['password'] = generate_password_hash(password)
                    save_json(ACCOUNTS_FILE, accounts, subfolder='account')

    if not is_valid:
        return jsonify({'error': 'Thông tin đăng nhập không đúng'}), 401
    
    token = generate_token(user_id)
    return jsonify({
        'message': 'Đăng nhập thành công',
        'token': token,
        'user': {
            'id': user_id,
            'email': user['email'],
            'username': user.get('username') or user_id,
            'account_type': user.get('account_type', 'user')
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
    accounts = load_json(ACCOUNTS_FILE, subfolder='account')
    users = accounts.get('users', {})
    for comment in property_comments:
        user = users.get(comment['user_id'], {})
        comment['username'] = user.get('username') or comment['user_id']
    
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
    
    accounts = load_json(ACCOUNTS_FILE, subfolder='account')
    users = accounts.get('users', {})
    user = users.get(user_id, {})
    
    new_comment = {
        'user_id': user_id,
        'username': user.get('username') or user_id,
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

# Get favorites with details
@app.route('/api/favorites/<user_id>', methods=['GET'])
def get_favorites_with_details(user_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    current_user_id = verify_token(token)
    
    if not current_user_id or current_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    favorites = load_json(FAVORITES_FILE)
    user_favorites = favorites.get(user_id, [])
    
    # Load properties data to get details
    try:
        properties = load_json('data.json', subfolder=None)
        favorite_items = []
        
        for prop_id in user_favorites:
            # Find property by ID
            for prop in properties.values():
                if isinstance(prop, list):
                    for item in prop:
                        if item.get('id') == prop_id or item.get('property_id') == prop_id:
                            favorite_items.append({
                                'id': prop_id,
                                'title': item.get('title') or item.get('name'),
                                'created_at': datetime.utcnow().isoformat()
                            })
                elif isinstance(prop, dict) and (prop.get('id') == prop_id or prop.get('property_id') == prop_id):
                    favorite_items.append({
                        'id': prop_id,
                        'title': prop.get('title') or prop.get('name'),
                        'created_at': datetime.utcnow().isoformat()
                    })
        
        return jsonify({'favorites': favorite_items}), 200
    except:
        return jsonify({'favorites': []}), 200

# Remove from favorites (with user_id)
@app.route('/api/favorites/<user_id>/<property_id>', methods=['DELETE'])
def remove_favorite_v2(user_id, property_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    current_user_id = verify_token(token)
    
    if not current_user_id or current_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    favorites = load_json(FAVORITES_FILE)
    
    if user_id in favorites and property_id in favorites[user_id]:
        favorites[user_id].remove(property_id)
        save_json(FAVORITES_FILE, favorites)
        return jsonify({'message': 'Đã xóa khỏi yêu thích'}), 200
    
    return jsonify({'message': 'Không tìm thấy trong danh sách yêu thích'}), 404

# Get search history (with user_id)
@app.route('/api/search-history/<user_id>', methods=['GET'])
def get_search_history_v2(user_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    current_user_id = verify_token(token)
    
    if not current_user_id or current_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    history = load_json(SEARCH_HISTORY_FILE)
    user_history = history.get(user_id, [])
    
    return jsonify({'history': user_history}), 200

# Remove from search history
@app.route('/api/search-history/<user_id>/<history_id>', methods=['DELETE'])
def remove_search_history(user_id, history_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    current_user_id = verify_token(token)
    
    if not current_user_id or current_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    history = load_json(SEARCH_HISTORY_FILE)
    
    if user_id in history:
        history[user_id] = [item for item in history[user_id] if item.get('id') != history_id]
        save_json(SEARCH_HISTORY_FILE, history)
        return jsonify({'message': 'Đã xóa khỏi lịch sử'}), 200
    
    return jsonify({'message': 'Không tìm thấy'}), 404

# Update user username
@app.route('/api/user/<user_id>/update-username', methods=['PUT'])
def update_username(user_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    current_user_id = verify_token(token)
    
    if not current_user_id or current_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    new_username = data.get('username', '').strip()
    
    if not new_username:
        return jsonify({'message': 'Tên đăng nhập không được để trống'}), 400
    
    if len(new_username) < 2:
        return jsonify({'message': 'Tên đăng nhập phải có ít nhất 2 ký tự'}), 400
    
    accounts = load_json(ACCOUNTS_FILE, subfolder='account')
    users = accounts.get('users', {})
    
    # Check if username already exists (by other users)
    for uid, user_data in users.items():
        if uid != user_id and user_data.get('username') == new_username:
            return jsonify({'message': 'Tên đăng nhập đã tồn tại'}), 400
    
    if user_id in users:
        users[user_id]['username'] = new_username
        accounts['users'] = users
        save_json(ACCOUNTS_FILE, accounts, subfolder='account')
        return jsonify({'message': 'Cập nhật tên đăng nhập thành công'}), 200
    
    return jsonify({'message': 'Người dùng không tồn tại'}), 404

# Update user email
@app.route('/api/user/<user_id>/update-email', methods=['PUT'])
def update_email(user_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    current_user_id = verify_token(token)
    
    if not current_user_id or current_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    new_email = data.get('email', '').strip()
    
    if not new_email:
        return jsonify({'message': 'Email không được để trống'}), 400
    
    # Validate email format
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', new_email):
        return jsonify({'message': 'Email không hợp lệ'}), 400
    
    accounts = load_json(ACCOUNTS_FILE, subfolder='account')
    users = accounts.get('users', {})
    
    # Check if email already exists (by other users)
    for uid, user_data in users.items():
        if uid != user_id and user_data.get('email') == new_email:
            return jsonify({'message': 'Email đã được đăng ký'}), 400
    
    if user_id in users:
        users[user_id]['email'] = new_email
        accounts['users'] = users
        save_json(ACCOUNTS_FILE, accounts, subfolder='account')
        return jsonify({'message': 'Cập nhật email thành công'}), 200
    
    return jsonify({'message': 'Người dùng không tồn tại'}), 404

# Update user password
@app.route('/api/user/<user_id>/update-password', methods=['PUT'])
def update_password(user_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    current_user_id = verify_token(token)
    
    if not current_user_id or current_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'message': 'Vui lòng điền tất cả các trường'}), 400
    
    if len(new_password) < 6:
        return jsonify({'message': 'Mật khẩu phải có ít nhất 6 ký tự'}), 400
    
    accounts = load_json(ACCOUNTS_FILE, subfolder='account')
    users = accounts.get('users', {})
    
    if user_id not in users:
        return jsonify({'message': 'Người dùng không tồn tại'}), 404
    
    user = users[user_id]
    
    # Verify current password
    try:
        is_valid = check_password_hash(user.get('password', ''), current_password)
    except:
        is_valid = False
    
    if not is_valid:
        return jsonify({'message': 'Mật khẩu hiện tại không đúng'}), 401
    
    # Update password
    users[user_id]['password'] = generate_password_hash(new_password)
    accounts['users'] = users
    save_json(ACCOUNTS_FILE, accounts, subfolder='account')
    
    return jsonify({'message': 'Cập nhật mật khẩu thành công'}), 200

# ============================================
# CHATBOT WITH GOOGLE GEMINI AI
# ============================================

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Chat endpoint - Gọi Google Gemini API cho chatbot thông minh
    
    Request JSON:
    {
        "message": "Giá phòng bao nhiêu?",
        "conversationHistory": [
            {"role": "user", "content": "..."},
            {"role": "bot", "content": "..."}
        ]
    }
    
    Response JSON:
    {
        "success": true,
        "response": "Giá phòng từ 1.5 - 3 triệu/tháng nhé! 😊",
        "model": "gemini-pro"
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({
                'error': 'Message is required',
                'response': 'Bạn chưa nhập câu hỏi. Hãy hỏi tôi về phòng trọ nhé! 😊'
            }), 400
        
        message = data.get('message', '').strip()
        conversation_history = data.get('conversationHistory', [])
        
        if not message:
            return jsonify({
                'error': 'Message cannot be empty',
                'response': 'Bạn chưa nhập câu hỏi. Hãy hỏi tôi về phòng trọ nhé! 😊'
            }), 400
        
        # Choose AI model based on configuration
        if USE_OPENAI and OPENAI_API_KEY:
            # Use OpenAI GPT
            try:
                import openai
                
                # Build conversation messages
                messages = [
                    {"role": "system", "content": CHATBOT_SYSTEM_PROMPT}
                ]
                
                # Add conversation history (last 5 messages)
                if conversation_history:
                    recent_history = conversation_history[-5:]
                    for msg in recent_history:
                        role = 'user' if msg.get('role') == 'user' else 'assistant'
                        content = msg.get('content', '')
                        messages.append({"role": role, "content": content})
                
                # Add current message
                messages.append({"role": "user", "content": message})
                
                # Call OpenAI API
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",  # or "gpt-4" for better quality
                    messages=messages,
                    temperature=0.7,
                    max_tokens=500
                )
                
                bot_reply = response.choices[0].message.content
                print(f'✅ OpenAI GPT called successfully. Message: "{message[:50]}..."')
                
                return jsonify({
                    'success': True,
                    'response': bot_reply,
                    'model': 'gpt-3.5-turbo'
                })
                
            except Exception as e:
                print(f'❌ OpenAI API error: {str(e)}')
                return jsonify({
                    'error': 'OpenAI API error',
                    'response': f'Lỗi kết nối OpenAI: {str(e)}'
                }), 500
        
        elif GEMINI_API_KEY:
            # Use Google Gemini (existing code)
            # Initialize Gemini model
            model = genai.GenerativeModel(
                'gemini-pro',
                generation_config={
                    'temperature': 0.7,
                    'top_k': 40,
                    'top_p': 0.95,
                    'max_output_tokens': 500,
                }
            )
            
            # Build conversation context
            full_prompt = CHATBOT_SYSTEM_PROMPT + '\n\n'
            
            # Add conversation history (last 5 messages)
            if conversation_history:
                recent_history = conversation_history[-5:]
                full_prompt += 'LỊCH SỬ HỘI THOẠI:\n'
                for msg in recent_history:
                    role = 'Khách' if msg.get('role') == 'user' else 'Bạn'
                    content = msg.get('content', '')
                    full_prompt += f'{role}: {content}\n'
                full_prompt += '\n'
            
            full_prompt += f'KHÁCH HỎI: {message}\n\nTRẢ LỜI:'
            
            # Call Gemini API
            response = model.generate_content(full_prompt)
            bot_reply = response.text
            
            print(f'✅ Gemini API called successfully. Message: "{message[:50]}..."')
            
            return jsonify({
                'success': True,
                'response': bot_reply,
                'model': 'gemini-pro'
            })
        else:
            # No API key configured
            print('❌ No AI API key found')
            return jsonify({
                'error': 'API key not configured',
                'response': 'Xin lỗi, chatbot đang bảo trì. Vui lòng thử lại sau! 🔧'
            }), 500
    
    except Exception as e:
        print(f'❌ Error calling Gemini API: {str(e)}')
        
        # Return friendly error message
        return jsonify({
            'error': str(e),
            'response': 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Bạn có thể thử lại sau hoặc liên hệ trực tiếp chủ trọ nhé! 🙏'
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint cho chatbot"""
    return jsonify({
        'status': 'ok',
        'message': 'Chatbot API is running',
        'hasApiKey': bool(GEMINI_API_KEY),
        'timestamp': datetime.utcnow().isoformat()
    })

# ============================================
# VISITOR TRACKING (Realtime)
# ============================================

# In-memory storage for online visitors (production should use Redis)
online_visitors = {}
VISITOR_TIMEOUT = 30  # seconds

# File to store total visits
VISITOR_FILE = 'visitor_stats.json'
init_data_file(VISITOR_FILE, {'total_visits': 0, 'unique_visitors': set()}, subfolder='backend')

@app.route('/api/visitor/ping', methods=['POST'])
def visitor_ping():
    data = request.get_json()
    session_id = data.get('sessionId')
    
    if not session_id:
        return jsonify({'error': 'Session ID required'}), 400
    
    current_time = datetime.now()
    
    # Load visitor stats
    visitor_stats = load_json(VISITOR_FILE)
    
    # Check if this is a new visitor
    is_new_visitor = session_id not in online_visitors
    
    # Update online visitors with timestamp
    online_visitors[session_id] = current_time
    
    # If new visitor, increment total visits
    if is_new_visitor:
        visitor_stats['total_visits'] = visitor_stats.get('total_visits', 0) + 1
        save_json(VISITOR_FILE, visitor_stats)
    
    # Clean up expired visitors (timeout after 30 seconds)
    expired_sessions = [
        sid for sid, timestamp in online_visitors.items()
        if (current_time - timestamp).total_seconds() > VISITOR_TIMEOUT
    ]
    for sid in expired_sessions:
        del online_visitors[sid]
    
    return jsonify({
        'online': len(online_visitors),
        'total': visitor_stats.get('total_visits', 0)
    }), 200

@app.route('/api/visitor/disconnect', methods=['POST'])
def visitor_disconnect():
    data = request.get_json()
    session_id = data.get('sessionId')
    
    if session_id and session_id in online_visitors:
        del online_visitors[session_id]
    
    return jsonify({'status': 'ok'}), 200

# ============================================
# STATIC FILES
# ============================================
# PARTNER-SPECIFIC ROUTES
# ============================================

@app.route('/api/partner/login', methods=['POST'])
def partner_login():
    """Đăng nhập cho đối tác - kiểm tra account_type = 'partner'"""
    data = request.get_json()
    email_or_username = data.get('email')
    password = data.get('password')
    
    if not email_or_username or not password:
        return jsonify({'error': 'Email/username và password là bắt buộc'}), 400
    
    accounts = load_json(ACCOUNTS_FILE, subfolder='account')
    users = accounts.get('users', {})
    
    # Find partner account
    partner = None
    partner_id = None
    for uid, user_data in users.items():
        if user_data.get('account_type') == 'partner':
            if (user_data.get('email') == email_or_username or 
                user_data.get('username') == email_or_username or 
                uid == email_or_username):
                partner = user_data
                partner_id = uid
                break
    
    if not partner:
        return jsonify({'error': 'Tài khoản đối tác không tồn tại'}), 401
    
    # Verify password
    stored_pw = partner.get('password', '')
    is_valid = False
    try:
        is_valid = check_password_hash(stored_pw, password)
    except Exception:
        is_valid = False

    # Fallback for plaintext passwords
    if not is_valid and stored_pw == password:
        is_valid = True
        # Auto-upgrade to hashed password
        accounts = load_json(ACCOUNTS_FILE, subfolder='account')
        if 'users' in accounts and partner_id in accounts['users']:
            accounts['users'][partner_id]['password'] = generate_password_hash(password)
            save_json(ACCOUNTS_FILE, accounts, subfolder='account')

    if not is_valid:
        return jsonify({'error': 'Mật khẩu không đúng'}), 401
    
    token = generate_token(partner_id)
    return jsonify({
        'message': 'Đăng nhập thành công',
        'token': token,
        'partner': {
            'id': partner_id,
            'email': partner.get('email'),
            'username': partner.get('username'),
            'business_name': partner.get('business_name', ''),
            'verified': partner.get('verified', False)
        }
    }), 200

@app.route('/api/partner/stats', methods=['GET'])
def get_partner_stats():
    """Lấy thống kê cho partner dashboard"""
    # Get partner_id from authorization header or query param
    auth_header = request.headers.get('Authorization')
    partner_id = request.args.get('partner_id')
    
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        partner_id = verify_token(token)
    
    if not partner_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Mock stats - replace with real data from database
    stats = {
        'total_properties': 5,
        'total_views': 1234,
        'total_bookings': 12,
        'total_revenue': 15000000,  # VND
        'pending_bookings': 3
    }
    
    return jsonify(stats), 200

# ============================================

# Serve static files (for development)
@app.route('/')
def serve_index():
    return send_from_directory(app.config['DATA_DIR'], 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.config['DATA_DIR'], path)

if __name__ == '__main__':
    print('🚀 Backend server running on http://localhost:5000')
    print('📡 Chatbot API: http://localhost:5000/api/chat')
    print(f'🔑 Gemini API: {"✅ Configured" if GEMINI_API_KEY else "❌ Missing"}')
    print('\nPress CTRL+C to stop')
    app.run(debug=True, host='0.0.0.0', port=5000)
