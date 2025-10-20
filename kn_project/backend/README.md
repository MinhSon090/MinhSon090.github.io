# HolaHome Backend - Python Flask

Backend API server for HolaHome property rental website.

## Features

- User authentication (Register/Login) with JWT tokens
- Property data API
- Rating system for properties
- Comment system
- Favorites management
- Search history tracking
- CORS enabled for frontend integration

## Installation

1. Install Python 3.8 or higher

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Properties
- `GET /api/properties` - Get all properties

### Authentication
- `POST /api/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "password"
  }
  ```

- `POST /api/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password"
  }
  ```

### Ratings
- `GET /api/ratings/<property_id>` - Get ratings for a property
- `POST /api/ratings/<property_id>` - Add/update rating (requires authentication)
  ```json
  {
    "rating": 5
  }
  ```

### Comments
- `GET /api/comments/<property_id>` - Get comments for a property
- `POST /api/comments/<property_id>` - Add comment (requires authentication)
  ```json
  {
    "text": "Great place!",
    "rating": 5
  }
  ```

### Favorites
- `GET /api/favorites` - Get user's favorites (requires authentication)
- `POST /api/favorites/<property_id>` - Add to favorites (requires authentication)
- `DELETE /api/favorites/<property_id>` - Remove from favorites (requires authentication)

### Search History
- `GET /api/search-history` - Get user's search history (requires authentication)
- `POST /api/search-history` - Add to search history (requires authentication)
  ```json
  {
    "type": "Nhà trọ",
    "area": "Thạch Hoà",
    "keyword": "search term"
  }
  ```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Data Storage

Data is stored in JSON files in the `backend` directory:
- `users.json` - User accounts
- `ratings.json` - Property ratings
- `comments.json` - Property comments
- `favorites.json` - User favorites
- `search_history.json` - Search history

## Development

For production deployment, consider:
- Using a proper database (PostgreSQL, MongoDB, etc.)
- Implementing proper password reset functionality
- Adding rate limiting
- Using environment variables for configuration
- Implementing proper logging
- Adding input validation and sanitization
