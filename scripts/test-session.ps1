$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Step 1: Login & simpan cookie
$body = '{"username":"admin","password":"admin123"}'
$loginResp = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -WebSession $session
Write-Host "Login: $($loginResp.StatusCode) - $($loginResp.Content)"

# Step 2: Test /api/auth/session dengan cookie
Write-Host ""
Write-Host "=== Test /api/auth/session ==="
$sessionResp = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/session" -Method GET -UseBasicParsing -WebSession $session
Write-Host "Status: $($sessionResp.StatusCode)"
Write-Host "Body: $($sessionResp.Content)"

# Step 3: Test tanpa cookie
Write-Host ""
Write-Host "=== Test /api/auth/session TANPA cookie ==="
$sessionNoAuth = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/session" -Method GET -UseBasicParsing
Write-Host "Status: $($sessionNoAuth.StatusCode)"
Write-Host "Body: $($sessionNoAuth.Content)"
