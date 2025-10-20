# HolaHome - Property Rental Platform

A web application for finding rental properties (nhà trọ) and dormitories (ký túc xá) near universities in Hà Nội, Vietnam.

## Features

### Frontend
- Property listing and search
- Filter by type (Nhà trọ/Ký túc xá) and area
- Search by keywords
- Sort by price
- Property details with image gallery
- User authentication (Login/Register)
- Rating and comment system
- Favorites management
- Search history

### Backend (Python Flask)
- RESTful API
- JWT-based authentication
- Property data management
- User ratings and comments
- Favorites tracking
- Search history storage
- CORS support for frontend integration

## Project Structure

```
kn_project/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── README.md          # Backend documentation
│   ├── users.json         # User database
│   ├── ratings.json       # Ratings database
│   ├── comments.json      # Comments database
│   ├── favorites.json     # Favorites database
│   └── search_history.json # Search history database
├── images/                 # Property images
├── logo/                   # Logo files
├── index.html             # Main HTML file
├── style.css              # Styles
├── script.js              # Original JavaScript (standalone)
├── script_backend.js      # JavaScript with backend integration
├── data.json              # Property data
├── setup.ps1              # Setup script
└── start_server.ps1       # Server startup script
```

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)
- Modern web browser

### Installation

1. **Install Python Dependencies**
   ```powershell
   .\setup.ps1
   ```
   
   Or manually:
   ```powershell
   pip install -r backend/requirements.txt
   ```

2. **Start the Backend Server**
   ```powershell
   .\start_server.ps1
   ```
   
   Or manually:
   ```powershell
   cd backend
   python app.py
   ```

   The server will start at `http://localhost:5000`

3. **Open the Website**
   
   Option 1 - Using the backend server (recommended):
   - Open your browser and navigate to `http://localhost:5000`
   
   Option 2 - Open index.html directly:
   - Replace `script.js` with `script_backend.js` in `index.html`:
     ```html
     <script src="script_backend.js"></script>
     ```
   - Open `index.html` in your browser

## Usage

### For Users

1. **Browse Properties**
   - View all available properties on the homepage
   - Properties are categorized as "Nhà trọ" or "Ký túc xá"

2. **Search & Filter**
   - Use the filter options to narrow down results
   - Search by keywords (title, address)
   - Sort by price (ascending/descending)

3. **View Details**
   - Click on any property card to view full details
   - Browse through property images
   - Read descriptions and amenities

4. **Register/Login**
   - Click "Đăng ký" to create an account
   - Click "Đăng nhập" to access your account

5. **Rate & Comment** (requires login)
   - Open a property detail
   - Select stars to rate (1-5)
   - Write and submit comments

6. **Manage Favorites** (requires login)
   - Add properties to your favorites
   - Access favorites from the menu

7. **Search History** (requires login)
   - View your previous searches
   - Access from "Lịch sử tìm kiếm" menu

## API Endpoints

See `backend/README.md` for detailed API documentation.

## Development

### Frontend Development
- Edit `index.html` for structure
- Edit `style.css` for styling
- Edit `script_backend.js` for functionality

### Backend Development
- Edit `backend/app.py` for API logic
- Data is stored in JSON files in the `backend/` directory
- For production, consider using a proper database

### Adding New Properties

Edit `data.json` and add a new entry:
```json
{
  "id": "unique_id",
  "loai": "Nhà trọ",
  "title": "Property Name",
  "address": "<strong>Địa chỉ:</strong> Full Address",
  "price": "<strong>Giá:</strong> Price Range",
  "img": ["path/to/image1.jpg", "path/to/image2.jpg"],
  "description": "path/to/description.html or direct text"
}
```

## Configuration

### Backend Configuration (app.py)
- `SECRET_KEY`: Change this in production
- `DEBUG`: Set to `False` in production
- `PORT`: Default is 5000

### Frontend Configuration (script_backend.js)
- `API_BASE_URL`: Backend API URL (default: `http://localhost:5000/api`)

## Security Notes

⚠️ **Important for Production:**
- Change the `SECRET_KEY` in `backend/app.py`
- Use a proper database instead of JSON files
- Implement HTTPS
- Add rate limiting
- Implement proper input validation
- Use environment variables for sensitive data
- Add password reset functionality
- Implement email verification

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Python, Flask
- **Authentication:** JWT (JSON Web Tokens)
- **Storage:** JSON files (development only)

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Edge
- Safari

## License

This project is for educational purposes.

## Support

For issues or questions, please check:
- Backend documentation: `backend/README.md`
- Check console for error messages
- Ensure backend server is running

## Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Image upload functionality
- [ ] Email notifications
- [ ] Advanced search with maps
- [ ] Payment integration
- [ ] Admin dashboard
- [ ] Mobile responsive design improvements
- [ ] Real-time chat with property owners
