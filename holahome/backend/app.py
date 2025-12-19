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
CHATBOT_SYSTEM_PROMPT = """Bạn là HomieAI - trợ lý ảo chuyên nghiệp của HolaHome, hỗ trợ tư vấn phòng trọ tại khu vực Hòa Lạc, Hà Nội.

🏠 THÔNG TIN CƠ BẢN VỀ PHÒNG TRỌ:
━━━━━━━━━━━━━━━━━━━━━━
• Giá phòng: 1.5 - 3 triệu/tháng (tùy loại phòng, diện tích)
  - Phòng cơ bản (15-20m²): 1.5-2 triệu
  - Phòng có điều hòa (20-25m²): 2.5-3 triệu
  - Phòng full nội thất (25-30m²): 3-3.5 triệu

• Tiện ích miễn phí: WiFi tốc độ cao, giường, tủ, bàn học, máy giặt chung
• Chi phí phát sinh: Điện 3,500đ/kWh, Nước 20,000đ/người hoặc 100,000đ/khối
• Được nấu ăn thoải mái (có bếp chung hoặc riêng)
• Vị trí: Gần ĐH FPT, ĐH Quốc Gia, Học Viện Kỹ Thuật Quân Sự (5-10 phút xe máy)
• Giờ giấc: Tự do, chỉ giữ yên tĩnh sau 22h
• Thú cưng: Tùy chủ nhà (một số cho phép mèo, chó nhỏ)
• Đặt cọc: 1-2 tháng tiền phòng (hoàn trả khi trả phòng)
• An ninh: Camera 24/7, bảo vệ, cổng vân tay/thẻ từ
• Chỗ để xe: Rộng rãi, có mái che, miễn phí hoặc 50-100k/tháng

📋 CÂU HỎI THƯỜNG GẶP (FAQ):
━━━━━━━━━━━━━━━━━━━━━━
1. Giá phòng: 1.5-3tr/tháng tùy diện tích và tiện ích
2. Tiện ích: Wifi, giường, tủ, bàn, máy giặt chung, bãi xe, camera an ninh
3. Điện nước: Điện 3,500đ/số, nước 20-100k/người/tháng
4. Nấu ăn: Được phép, có bếp chung/riêng
5. Vị trí: Gần ĐH FPT, ĐHQG, HVKTQS (5-10 phút)
6. Giờ giấc: Tự do, giữ trật tự sau 22h
7. Thú cưng: Tùy chủ nhà
8. Đặt cọc: 1-2 tháng tiền phòng
9. Điều hòa/nóng lạnh: Có nhiều loại phòng (từ cơ bản đến full nội thất)
10. An ninh: Camera 24/7, bảo vệ, khóa vân tay
11. Chỗ xe: Rộng rãi, có mái che
12. Wifi: Miễn phí, tốc độ cao
13. Diện tích: 15-30m²
14. Ở ghép: Có phòng 2-3 người
15. Hợp đồng: Tối thiểu 6 tháng hoặc 1 năm
16. Siêu thị: Có Circle K, GS25, VinMart gần (5-10 phút đi bộ)
17. Khách qua đêm: Được phép nhưng cần báo trước
18. Nội thất: Tùy loại từ cơ bản đến full
19. Xem phòng: Liên hệ qua SĐT/Zalo để hẹn
20. Thanh toán: Cuối tháng, có công tơ riêng

🎯 NHIỆM VỤ CỦA BẠN:
━━━━━━━━━━━━━━━━━━━━━━
1. Trả lời câu hỏi về phòng trọ dựa trên thông tin trên
2. Gợi ý phòng trọ phù hợp khi người dùng hỏi về loại phòng, giá, vị trí
3. Hướng dẫn khách liên hệ chủ trọ nếu cần thông tin chi tiết
4. Luôn thân thiện, nhiệt tình, chuyên nghiệp

📝 QUY TẮC TRẢ LỜI:
━━━━━━━━━━━━━━━━━━━━━━
✓ Trả lời ngắn gọn, rõ ràng, dễ hiểu
✓ Sử dụng emoji phù hợp để thân thiện 😊🏠✨
✓ Nếu không chắc chắn, khuyên khách liên hệ trực tiếp chủ trọ
✓ Luôn kết thúc bằng câu hỏi tiếp theo để tiếp tục hỗ trợ
✓ KHÔNG bịa đặt thông tin không có
✓ Ưu tiên thông tin từ FAQ trước, sau đó mới diễn giải
✓ Khi gợi ý phòng, đề cập tên phòng cụ thể nếu có trong dữ liệu

🚫 KHÔNG ĐƯỢC:
━━━━━━━━━━━━━━━━━━━━━━
✗ Trả lời về chủ đề không liên quan đến phòng trọ
✗ Bịa đặt giá hoặc thông tin không có
✗ Hứa hẹn điều không chắc chắn
✗ Trả lời dài dòng, lan man"""
# Data storage files
USER_ACCOUNTS_FILE = 'accounts/user/accounts.json'
PARTNER_ACCOUNTS_FILE = 'accounts/partner/partner_accounts.json'
RATINGS_FILE = 'ratings.json'
COMMENTS_FILE = 'comments.json'
FAVORITES_FILE = 'favorites.json'
SEARCH_HISTORY_FILE = 'search_history.json'
PENDING_POSTS_FILE = 'pending_posts.json'
BOOKINGS_FILE = 'bookings.json'

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

# Initialize user and partner account files
init_data_file(USER_ACCOUNTS_FILE, {'users': {}, 'next_user_id': 8}, subfolder=None)
init_data_file(PARTNER_ACCOUNTS_FILE, {'partners': {}, 'next_partner_id': 2}, subfolder=None)
init_data_file(RATINGS_FILE, {})
init_data_file(COMMENTS_FILE, {})
init_data_file(FAVORITES_FILE, {})
init_data_file(SEARCH_HISTORY_FILE, {})
init_data_file(PENDING_POSTS_FILE, {'posts': [], 'next_post_id': 1}, subfolder='backend')
init_data_file(BOOKINGS_FILE, {'bookings': [], 'next_booking_id': 1}, subfolder='backend')

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
    
    print(f"💾 Saving to: {filepath}")  # Debug log
    
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

def get_user_id_from_token():
    """Extract user ID from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    return verify_token(token)

def load_all_accounts():
    """Load both user and partner accounts into a single dict"""
    user_accounts = load_json(USER_ACCOUNTS_FILE, subfolder=None)
    partner_accounts = load_json(PARTNER_ACCOUNTS_FILE, subfolder=None)
    
    all_users = {}
    all_users.update(user_accounts.get('users', {}))
    all_users.update(partner_accounts.get('partners', {}))
    
    return all_users

def save_account(user_id, user_data):
    """Save account to appropriate file based on account_type"""
    account_type = user_data.get('account_type', 'user')
    
    if account_type == 'partner':
        accounts = load_json(PARTNER_ACCOUNTS_FILE, subfolder=None)
        accounts['partners'] = accounts.get('partners', {})
        accounts['partners'][user_id] = user_data
        save_json(PARTNER_ACCOUNTS_FILE, accounts, subfolder=None)
    else:
        accounts = load_json(USER_ACCOUNTS_FILE, subfolder=None)
        accounts['users'] = accounts.get('users', {})
        accounts['users'][user_id] = user_data
        save_json(USER_ACCOUNTS_FILE, accounts, subfolder=None)

# Routes

# Get property data
@app.route('/api/properties', methods=['GET'])
def get_properties():
    try:
        filepath = os.path.join(app.config['DATA_DIR'], 'data.json')
        with open(filepath, 'r', encoding='utf-8') as f:
            properties = json.load(f)
        
        # Load ratings and favorites to calculate stats
        ratings = load_json(RATINGS_FILE)
        favorites = load_json(FAVORITES_FILE)
        
        # Enrich properties with stats
        for prop in properties:
            property_id = prop.get('id')
            
            # Calculate average rating
            prop_ratings = ratings.get(property_id, [])
            if prop_ratings:
                avg_rating = sum(r['rating'] for r in prop_ratings) / len(prop_ratings)
                prop['average_rating'] = round(avg_rating, 1)
                prop['rating_count'] = len(prop_ratings)
            else:
                prop['average_rating'] = 0
                prop['rating_count'] = 0
            
            # Count favorites
            favorite_count = sum(1 for user_favs in favorites.values() if property_id in user_favs)
            prop['favorite_count'] = favorite_count
            
            # View count from data.json
            prop['view_count'] = prop.get('views', 0)
        
        return jsonify(properties), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Increment property view count
@app.route('/api/properties/<property_id>/view', methods=['POST'])
def increment_view(property_id):
    try:
        filepath = os.path.join(app.config['DATA_DIR'], 'data.json')
        with open(filepath, 'r', encoding='utf-8') as f:
            properties = json.load(f)
        
        # Find and update the property
        for prop in properties:
            if prop.get('id') == property_id:
                prop['views'] = prop.get('views', 0) + 1
                break
        
        # Save updated data
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(properties, f, ensure_ascii=False, indent=2)
        
        return jsonify({'success': True, 'views': prop.get('views', 0)}), 200
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
    
    # Load appropriate accounts file
    if account_type == 'partner':
        accounts = load_json(PARTNER_ACCOUNTS_FILE, subfolder=None)
        users = accounts.get('partners', {})
    else:
        accounts = load_json(USER_ACCOUNTS_FILE, subfolder=None)
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
    
    # Random avatar for new user
    import random
    import os
    
    # Build avatar list from all folders
    avatar_folders = ['Pengiun', 'Bee', 'Hamster', 'Birt']
    available_avatars = []
    for folder in avatar_folders:
        folder_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'avatar_imgs', folder)
        if os.path.exists(folder_path):
            for file in os.listdir(folder_path):
                if file.endswith('.jpg'):
                    available_avatars.append(f'avatar_imgs/{folder}/{file}')
    
    random_avatar = random.choice(available_avatars) if available_avatars else 'default'
    
    # Create new user
    users[user_id] = {
        'id': user_id,
        'email': email,
        'username': username or '',
        'password': generate_password_hash(password),
        'account_type': account_type,
        'avatar': random_avatar,
        'created_at': datetime.utcnow().isoformat()
    }
    
    if account_type == 'partner':
        accounts['partners'] = users
        save_json(PARTNER_ACCOUNTS_FILE, accounts, subfolder=None)
    else:
        accounts['users'] = users
        save_json(USER_ACCOUNTS_FILE, accounts, subfolder=None)
    
    token = generate_token(user_id)
    return jsonify({
        'message': 'Đăng ký thành công',
        'token': token,
        'user': {
            'id': user_id,
            'email': email,
            'username': username or user_id,
            'account_type': account_type,
            'avatar': random_avatar
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
    
    # Try user accounts first
    user_accounts = load_json(USER_ACCOUNTS_FILE, subfolder=None)
    users = user_accounts.get('users', {})
    
    user = None
    user_id = None
    
    # Find in user accounts
    for uid, user_data in users.items():
        if (user_data.get('email') == email_or_username or 
            user_data.get('username') == email_or_username or 
            uid == email_or_username):
            user = user_data
            user_id = uid
            break
    
    # If not found, try partner accounts
    if not user:
        partner_accounts = load_json(PARTNER_ACCOUNTS_FILE, subfolder=None)
        partners = partner_accounts.get('partners', {})
        
        for uid, user_data in partners.items():
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

    # Fallback: if stored password is plaintext, compare directly
    if not is_valid:
        if not isinstance(stored_pw, str) or not stored_pw.startswith('pbkdf2:'):
            if stored_pw == password:
                is_valid = True
                # Auto-upgrade to hashed password
                if user.get('account_type') == 'partner':
                    partner_accounts = load_json(PARTNER_ACCOUNTS_FILE, subfolder=None)
                    if 'partners' in partner_accounts and user_id in partner_accounts['partners']:
                        partner_accounts['partners'][user_id]['password'] = generate_password_hash(password)
                        save_json(PARTNER_ACCOUNTS_FILE, partner_accounts, subfolder=None)
                else:
                    user_accounts = load_json(USER_ACCOUNTS_FILE, subfolder=None)
                    if 'users' in user_accounts and user_id in user_accounts['users']:
                        user_accounts['users'][user_id]['password'] = generate_password_hash(password)
                        save_json(USER_ACCOUNTS_FILE, user_accounts, subfolder=None)

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
            'account_type': user.get('account_type', 'user'),
            'avatar': user.get('avatar', 'default')
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
    all_users = load_all_accounts()
    for comment in property_comments:
        user = all_users.get(comment['user_id'], {})
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
    
    all_users = load_all_accounts()
    user = all_users.get(user_id, {})
    
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
    
    all_users = load_all_accounts()
    
    # Check if username already exists (by other users)
    for uid, user_data in all_users.items():
        if uid != user_id and user_data.get('username') == new_username:
            return jsonify({'message': 'Tên đăng nhập đã tồn tại'}), 400
    
    if user_id in all_users:
        user_data = all_users[user_id]
        user_data['username'] = new_username
        save_account(user_id, user_data)
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
    
    all_users = load_all_accounts()
    
    # Check if email already exists (by other users)
    for uid, user_data in all_users.items():
        if uid != user_id and user_data.get('email') == new_email:
            return jsonify({'message': 'Email đã được đăng ký'}), 400
    
    if user_id in all_users:
        user_data = all_users[user_id]
        user_data['email'] = new_email
        save_account(user_id, user_data)
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
    
    all_users = load_all_accounts()
    
    if user_id not in all_users:
        return jsonify({'message': 'Người dùng không tồn tại'}), 404
    
    user = all_users[user_id]
    
    # Verify current password
    try:
        is_valid = check_password_hash(user.get('password', ''), current_password)
    except:
        is_valid = False
    
    if not is_valid:
        return jsonify({'message': 'Mật khẩu hiện tại không đúng'}), 401
    
    # Update password
    user['password'] = generate_password_hash(new_password)
    save_account(user_id, user)
    
    return jsonify({'message': 'Cập nhật mật khẩu thành công'}), 200

# Update user avatar
@app.route('/api/user/avatar', methods=['PUT'])
def update_avatar():
    user_id = get_user_id_from_token()
    
    if not user_id:
        return jsonify({'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    avatar = data.get('avatar')
    
    if not avatar:
        return jsonify({'message': 'Avatar is required'}), 400
    
    all_users = load_all_accounts()
    
    if user_id not in all_users:
        return jsonify({'message': 'Người dùng không tồn tại'}), 404
    
    user = all_users[user_id]
    
    # Update avatar
    user['avatar'] = avatar
    save_account(user_id, user)
    
    return jsonify({
        'message': 'Cập nhật avatar thành công',
        'avatar': avatar
    }), 200

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
        "model": "gemini-1.5-flash"
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
        
        # Check if user is asking for room suggestions - FALLBACK to old chatbot logic
        suggestion_keywords = ['gợi ý', 'gợi ý phòng', 'tư vấn phòng', 'đề xuất', 'đề xuất phòng', 'phòng nào tốt', 'phòng nào phù hợp', 'suggest', 'recommend']
        is_asking_suggestions = any(keyword in message.lower() for keyword in suggestion_keywords)
        
        if is_asking_suggestions:
            # Return a message asking user to use the suggestion feature on frontend
            return jsonify({
                'success': True,
                'response': 'Mình có thể giúp bạn tìm phòng phù hợp! Bạn muốn tìm phòng ở khu vực nào? Giá khoảng bao nhiêu? Hoặc bạn có thể dùng tính năng Tìm kiếm và Bộ lọc ở trang chủ để xem các phòng phù hợp nhất nhé! 🏠✨',
                'model': 'fallback',
                'needsSuggestion': True
            })
        
        # Load property data for context (but not for suggestions)
        property_data_context = ""
        try:
            data_file = os.path.join(app.config['DATA_DIR'], 'data.json')
            if os.path.exists(data_file):
                with open(data_file, 'r', encoding='utf-8') as f:
                    properties = json.load(f)
                    
                # Build property list for context (only if user asks about specific rooms by name)
                specific_room_keywords = ['suha', 'ktxbc', 'minh anh', 'hkl', 'nha tro', 'duy phat']
                if any(keyword in message.lower() for keyword in specific_room_keywords):
                    property_data_context = "\n\n🏠 THÔNG TIN MỘT SỐ PHÒNG:\n"
                    for prop in properties[:5]:  # Limit to 5 properties
                        title = prop.get('title', 'N/A')
                        loai = prop.get('loai', 'N/A')
                        price = prop.get('price', '').replace('<strong>Giá:</strong> ', '')
                        
                        property_data_context += f"\n• {title} ({loai}) - {price}"
        except Exception as e:
            print(f'⚠️ Could not load property data: {e}')
        
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
                'gemini-2.5-flash',
                generation_config={
                    'temperature': 0.7,
                    'top_k': 40,
                    'top_p': 0.95,
                    'max_output_tokens': 500,
                }
            )
            
            # Build conversation context
            full_prompt = CHATBOT_SYSTEM_PROMPT + property_data_context + '\n\n'
            
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
            response = model.generate_content(
                full_prompt,
                safety_settings=[
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_NONE",
                    },
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_NONE",
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_NONE",
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_NONE",
                    },
                ]
            )
            
            # Check if response has valid content
            if not response.candidates:
                print('⚠️ Gemini returned no candidates - Fallback to old chatbot')
                return jsonify({
                    'success': False,
                    'needsFallback': True,
                    'originalMessage': message
                })
            
            candidate = response.candidates[0]
            
            # Check finish reason
            if candidate.finish_reason != 1:  # 1 = STOP (normal completion)
                print(f'⚠️ Gemini finish_reason: {candidate.finish_reason} - Fallback to old chatbot')
                return jsonify({
                    'success': False,
                    'needsFallback': True,
                    'originalMessage': message
                })
            
            # Extract text from response
            try:
                if hasattr(candidate.content, 'parts') and candidate.content.parts:
                    bot_reply = candidate.content.parts[0].text
                else:
                    bot_reply = response.text
            except Exception as extract_error:
                print(f'⚠️ Error extracting text: {extract_error} - Fallback to old chatbot')
                return jsonify({
                    'success': False,
                    'needsFallback': True,
                    'originalMessage': message
                })
            
            print(f'✅ Gemini API called successfully. Message: "{message[:50]}..."')
            
            return jsonify({
                'success': True,
                'response': bot_reply,
                'model': 'gemini-2.5-flash'
            })
        else:
            # No API key configured - fallback to old chatbot
            print('❌ No AI API key found - Fallback to old chatbot')
            return jsonify({
                'success': False,
                'needsFallback': True,
                'originalMessage': message
            })
    
    except Exception as e:
        print(f'❌ Error calling Gemini API: {str(e)} - Fallback to old chatbot')
        
        # Return fallback signal instead of error
        return jsonify({
            'success': False,
            'needsFallback': True,
            'originalMessage': message,
            'error': str(e)
        })

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
init_data_file(VISITOR_FILE, {'total_visits': 0, 'unique_visitors': []}, subfolder='backend')

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
    
    # Load partner accounts
    partner_accounts = load_json(PARTNER_ACCOUNTS_FILE, subfolder=None)
    partners = partner_accounts.get('partners', {})
    
    # Find partner account
    partner = None
    partner_id = None
    for pid, partner_data in partners.items():
        if (partner_data.get('email') == email_or_username or 
            partner_data.get('username') == email_or_username or 
            pid == email_or_username):
            partner = partner_data
            partner_id = pid
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
        partner['password'] = generate_password_hash(password)
        save_account(partner_id, partner)

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
# POST MANAGEMENT API (Partner → Founder Approval → Homepage)
# ============================================

@app.route('/api/posts', methods=['POST'])
def create_post():
    """Partner creates a new post (pending approval)"""
    try:
        data = request.json
        partner_id = data.get('partner_id')
        
        if not partner_id:
            return jsonify({'success': False, 'error': 'Partner ID required'}), 400
        
        # Load pending posts
        posts_data = load_json(PENDING_POSTS_FILE, subfolder='backend')
        
        # Create new post
        post_id = posts_data.get('next_post_id', 1)
        new_post = {
            'id': post_id,
            'partner_id': partner_id,
            'title': data.get('title'),
            'type': data.get('type'),
            'price': data.get('price'),
            'area': data.get('area'),
            'max_people': data.get('max_people', 1),
            'address': data.get('address'),
            'district': data.get('district'),
            'city': data.get('city'),
            'distance': data.get('distance'),
            'images': data.get('images', []),
            'amenities': data.get('amenities', []),
            'description': data.get('description'),
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'approved_at': None,
            'approved_by': None,
            'rejected_reason': None
        }
        
        if 'posts' not in posts_data:
            posts_data['posts'] = []
        posts_data['posts'].append(new_post)
        posts_data['next_post_id'] = post_id + 1
        
        save_json(PENDING_POSTS_FILE, posts_data, subfolder='backend')
        
        return jsonify({
            'success': True,
            'message': 'Tin đăng đã được gửi và đang chờ duyệt',
            'post_id': post_id
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """Get posts by status"""
    try:
        status = request.args.get('status', 'all')
        partner_id = request.args.get('partner_id')
        
        posts_data = load_json(PENDING_POSTS_FILE, subfolder='backend')
        posts = posts_data.get('posts', [])
        
        if status != 'all':
            posts = [p for p in posts if p.get('status') == status]
        
        if partner_id:
            posts = [p for p in posts if p.get('partner_id') == partner_id]
        
        posts.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'posts': posts,
            'count': len(posts)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>/approve', methods=['PUT'])
def approve_post(post_id):
    """Founder approves a post"""
    try:
        data = request.json
        founder_id = data.get('founder_id')
        
        if not founder_id:
            return jsonify({'success': False, 'error': 'Founder ID required'}), 400
        
        posts_data = load_json(PENDING_POSTS_FILE, subfolder='backend')
        posts = posts_data.get('posts', [])
        
        post = next((p for p in posts if p.get('id') == post_id), None)
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
        
        post['status'] = 'approved'
        post['approved_at'] = datetime.now().isoformat()
        post['approved_by'] = founder_id
        
        save_json(PENDING_POSTS_FILE, posts_data, subfolder='backend')
        
        # Add to main data.json for homepage
        try:
            main_data = load_json('data.json', subfolder=None)
            
            # Handle both array and object formats
            if isinstance(main_data, list):
                properties = main_data
            elif isinstance(main_data, dict) and 'properties' in main_data:
                properties = main_data['properties']
            else:
                properties = []
            
            # Create property in homepage format
            property_data = {
                'id': f"new_{post_id}",
                'loai': post.get('type', 'Phòng trọ'),
                'title': post.get('title'),
                'address': f"<strong>Địa chỉ:</strong> {post.get('address')}, {post.get('district')}, {post.get('city')}",
                'price': f"<strong>Giá:</strong> {post.get('price'):,} VND/tháng".replace(',', '.'),
                'img': post.get('images', []),
                'description': post.get('description'),
                'is_new': True,
                'approved_at': post.get('approved_at'),
                'area': post.get('area'),
                'amenities': post.get('amenities', []),
                'max_people': post.get('max_people', 1),
                'views': 0
            }
            
            # Insert at beginning
            properties.insert(0, property_data)
            
            # Save based on original format
            if isinstance(main_data, list):
                save_json('data.json', properties, subfolder=None)
            else:
                main_data['properties'] = properties
                save_json('data.json', main_data, subfolder=None)
                
            print(f"✅ Added to data.json: {property_data['title']}")
        except Exception as e:
            print(f"❌ Error adding to data.json: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Tin đăng đã được duyệt',
            'post': post
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>/reject', methods=['PUT'])
def reject_post(post_id):
    """Founder rejects a post"""
    try:
        data = request.json
        founder_id = data.get('founder_id')
        reason = data.get('reason', '')
        
        if not founder_id:
            return jsonify({'success': False, 'error': 'Founder ID required'}), 400
        
        posts_data = load_json(PENDING_POSTS_FILE, subfolder='backend')
        posts = posts_data.get('posts', [])
        
        post = next((p for p in posts if p.get('id') == post_id), None)
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
        
        post['status'] = 'rejected'
        post['approved_at'] = datetime.now().isoformat()
        post['approved_by'] = founder_id
        post['rejected_reason'] = reason
        
        save_json(PENDING_POSTS_FILE, posts_data, subfolder='backend')
        
        return jsonify({
            'success': True,
            'message': 'Tin đăng đã bị từ chối',
            'post': post
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>/request-delete', methods=['PUT'])
def request_delete_post(post_id):
    """Partner requests to delete a post"""
    try:
        data = request.json
        partner_id = data.get('partner_id')
        reason = data.get('reason', '')
        
        posts_data = load_json(PENDING_POSTS_FILE, subfolder='backend')
        posts = posts_data.get('posts', [])
        
        post = next((p for p in posts if p.get('id') == post_id), None)
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
        
        # Check if partner owns this post
        if post.get('partner_id') != partner_id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        post['delete_requested'] = True
        post['delete_request_at'] = datetime.now().isoformat()
        post['delete_reason'] = reason
        post['status'] = 'delete_pending'
        
        save_json(PENDING_POSTS_FILE, posts_data, subfolder='backend')
        
        return jsonify({
            'success': True,
            'message': 'Yêu cầu gỡ bài đã được gửi, chờ Founder duyệt',
            'post': post
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>/approve-delete', methods=['PUT'])
def approve_delete_post(post_id):
    """Founder approves delete request"""
    try:
        data = request.json
        founder_id = data.get('founder_id')
        
        posts_data = load_json(PENDING_POSTS_FILE, subfolder='backend')
        posts = posts_data.get('posts', [])
        
        post = next((p for p in posts if p.get('id') == post_id), None)
        if not post:
            return jsonify({'success': False, 'error': 'Post not found'}), 404
        
        # Remove from pending_posts
        posts_data['posts'] = [p for p in posts if p.get('id') != post_id]
        save_json(PENDING_POSTS_FILE, posts_data, subfolder='backend')
        
        # Also remove from data.json if it was approved before
        try:
            main_data = load_json('data.json', subfolder=None)
            if isinstance(main_data, list):
                main_data = [p for p in main_data if p.get('id') != f"new_{post_id}"]
                save_json('data.json', main_data, subfolder=None)
        except:
            pass
        
        return jsonify({
            'success': True,
            'message': 'Đã duyệt yêu cầu gỡ bài'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    """Delete a post (for founder only - direct delete)"""
    try:
        posts_data = load_json(PENDING_POSTS_FILE, subfolder='backend')
        posts = posts_data.get('posts', [])
        
        posts_data['posts'] = [p for p in posts if p.get('id') != post_id]
        
        save_json(PENDING_POSTS_FILE, posts_data, subfolder='backend')
        
        return jsonify({
            'success': True,
            'message': 'Tin đăng đã được xóa'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# BOOKING ENDPOINTS
# ============================================

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    """Create a new booking request"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['propertyId', 'propertyTitle', 'name', 'phone', 'cccd', 'date', 'time']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'Thiếu trường bắt buộc: {field}'}), 400
        
        # Clean property price - extract numbers and handle price ranges
        property_price = data.get('propertyPrice', '')
        if isinstance(property_price, str):
            import re
            # Check if it's a price range (contains dash/hyphen between numbers)
            # Examples: "1.5 - 2.5 triệu", "1,500,000 - 2,500,000", "<strong>Giá:</strong> 1.5 - 2.5 triệu"
            
            # Remove HTML tags first
            clean_text = re.sub(r'<[^>]+>', '', property_price)
            
            # Check for range pattern (numbers with dash between them)
            range_match = re.search(r'([\d.,]+)\s*-\s*([\d.,]+)', clean_text)
            
            if range_match:
                # It's a range - extract both numbers
                min_price = re.sub(r'[^\d]', '', range_match.group(1))
                max_price = re.sub(r'[^\d]', '', range_match.group(2))
                
                # Check if numbers are likely in millions (< 100 means it's in triệu format)
                if len(min_price) <= 2 or (int(min_price) < 100):
                    min_price = str(int(float(min_price) * 1000000))
                if len(max_price) <= 2 or (int(max_price) < 100):
                    max_price = str(int(float(max_price) * 1000000))
                
                property_price = f"{min_price} - {max_price}"
            else:
                # Single price - extract only numbers
                price_numbers = re.sub(r'[^\d]', '', property_price)
                property_price = price_numbers if price_numbers else '0'
        
        # Load bookings
        bookings_data = load_json(BOOKINGS_FILE, subfolder='backend')
        
        # Create new booking
        booking_id = bookings_data.get('next_booking_id', 1)
        new_booking = {
            'id': booking_id,
            'property_id': data.get('propertyId'),
            'property_title': data.get('propertyTitle'),
            'property_price': property_price,  # Clean price (numbers only)
            'customer_name': data.get('name'),
            'customer_phone': data.get('phone'),
            'customer_cccd': data.get('cccd'),
            'customer_email': data.get('email', ''),
            'visit_date': data.get('date'),
            'visit_time': data.get('time'),
            'note': data.get('note', ''),
            'status': 'pending',  # pending, confirmed, cancelled, completed
            'created_at': datetime.now().isoformat(),
            'confirmed_at': None,
            'confirmed_by': None,
            'cancelled_at': None,
            'cancelled_by': None,
            'cancel_reason': None
        }
        
        if 'bookings' not in bookings_data:
            bookings_data['bookings'] = []
        bookings_data['bookings'].append(new_booking)
        bookings_data['next_booking_id'] = booking_id + 1
        
        save_json(BOOKINGS_FILE, bookings_data, subfolder='backend')
        
        return jsonify({
            'success': True,
            'message': 'Yêu cầu đặt lịch đã được gửi thành công',
            'booking_id': booking_id
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    """Get bookings list"""
    try:
        status = request.args.get('status', 'all')
        property_id = request.args.get('property_id')
        partner_id = request.args.get('partner_id')  # Add partner_id filter
        
        bookings_data = load_json(BOOKINGS_FILE, subfolder='backend')
        bookings = bookings_data.get('bookings', [])
        
        # If partner_id is provided, only return confirmed bookings for that partner's properties
        if partner_id:
            # Get all approved posts by this partner
            posts_data = load_json(PENDING_POSTS_FILE, subfolder='backend')
            partner_property_ids = [f"new_{p['id']}" for p in posts_data.get('posts', []) 
                                   if p.get('partner_id') == partner_id and p.get('status') == 'approved']
            
            # Also check ntro1, ntro2, etc. format - map to partner
            # For now, only show confirmed bookings for new_ properties
            bookings = [b for b in bookings 
                       if b.get('property_id') in partner_property_ids 
                       and b.get('status') == 'confirmed']
        
        if status != 'all':
            bookings = [b for b in bookings if b.get('status') == status]
        
        if property_id:
            bookings = [b for b in bookings if b.get('property_id') == property_id]
        
        bookings.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'bookings': bookings,
            'count': len(bookings)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
        
        if status != 'all':
            bookings = [b for b in bookings if b.get('status') == status]
        
        if property_id:
            bookings = [b for b in bookings if b.get('property_id') == property_id]
        
        bookings.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'bookings': bookings,
            'count': len(bookings)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/bookings/<int:booking_id>/confirm', methods=['PUT'])
def confirm_booking(booking_id):
    """Confirm a booking (after payment)"""
    try:
        data = request.json
        partner_id = data.get('partner_id', 'partner')
        
        print(f"📝 Confirming booking #{booking_id}")
        
        bookings_data = load_json(BOOKINGS_FILE, subfolder='backend')
        bookings = bookings_data.get('bookings', [])
        
        booking = next((b for b in bookings if b.get('id') == booking_id), None)
        if not booking:
            print(f"❌ Booking #{booking_id} not found")
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
        
        # Update booking status
        booking['status'] = 'confirmed'
        booking['confirmed_at'] = datetime.now().isoformat()
        booking['confirmed_by'] = partner_id
        
        print(f"✅ Updated booking #{booking_id} to confirmed")
        
        # Save back to file
        save_json(BOOKINGS_FILE, bookings_data, subfolder='backend')
        
        print(f"💾 Saved to {BOOKINGS_FILE}")
        
        return jsonify({
            'success': True,
            'message': 'Đã xác nhận lịch hẹn',
            'booking': booking
        }), 200
        
    except Exception as e:
        print(f"❌ Error confirming booking: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/bookings/<int:booking_id>/cancel', methods=['PUT'])
def cancel_booking(booking_id):
    """Cancel a booking with reason"""
    try:
        data = request.json
        reason = data.get('reason', '')
        cancelled_by = data.get('cancelled_by', 'partner')
        
        print(f"📝 Cancelling booking #{booking_id} with reason: {reason}")
        
        bookings_data = load_json(BOOKINGS_FILE, subfolder='backend')
        bookings = bookings_data.get('bookings', [])
        
        booking = next((b for b in bookings if b.get('id') == booking_id), None)
        if not booking:
            print(f"❌ Booking #{booking_id} not found")
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
        
        # Update booking with cancellation info
        booking['status'] = 'cancelled'
        booking['cancelled_at'] = datetime.now().isoformat()
        booking['cancelled_by'] = cancelled_by
        booking['cancel_reason'] = reason
        
        print(f"✅ Updated booking #{booking_id} to cancelled")
        
        # Save back to file
        save_json(BOOKINGS_FILE, bookings_data, subfolder='backend')
        
        print(f"💾 Saved to {BOOKINGS_FILE}")
        
        return jsonify({
            'success': True,
            'message': 'Đã hủy lịch hẹn',
            'booking': booking
        }), 200
        
    except Exception as e:
        print(f"❌ Error cancelling booking: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

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
