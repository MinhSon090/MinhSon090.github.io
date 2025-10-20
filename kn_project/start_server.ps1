# Start the Flask backend server
Write-Host "Starting HolaHome Backend Server..." -ForegroundColor Green
Write-Host "Server will run on http://localhost:5500" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow

Set-Location backend
python app.py
