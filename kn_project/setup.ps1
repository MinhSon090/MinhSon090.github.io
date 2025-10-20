# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Green
pip install -r backend/requirements.txt

Write-Host "`nDependencies installed successfully!" -ForegroundColor Green
Write-Host "`nTo start the server, run:" -ForegroundColor Yellow
Write-Host "python backend/app.py" -ForegroundColor Cyan
