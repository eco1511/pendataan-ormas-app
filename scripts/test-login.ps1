$body = '{"username":"admin","password":"admin123"}'
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing 2>&1
Write-Host "Status: $($response.StatusCode)"
Write-Host "Body: $($response.Content)"
