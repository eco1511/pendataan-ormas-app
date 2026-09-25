$body = '{"username":"admin","password":"admin123"}'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Step 1: Login
Write-Host "=== STEP 1: Login ==="
$loginResp = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -WebSession $session
Write-Host "Status: $($loginResp.StatusCode)"
Write-Host "Body: $($loginResp.Content)"

# Check Set-Cookie header
$setCookie = $loginResp.Headers['Set-Cookie']
Write-Host "Set-Cookie: $setCookie"
Write-Host ""

# Step 2: Access dashboard
Write-Host "=== STEP 2: Dashboard (with cookie) ==="
try {
    $dashResp = Invoke-WebRequest -Uri "http://localhost:3000/dashboard" -Method GET -UseBasicParsing -WebSession $session -MaximumRedirection 10
    Write-Host "Final Status: $($dashResp.StatusCode)"
    Write-Host "Final URL: $($dashResp.BaseResponse.ResponseUri)"
    Write-Host "Content length: $($dashResp.Content.Length)"
    # Check if redirected back to login
    if ($dashResp.Content -match 'login' -or $dashResp.BaseResponse.ResponseUri -match 'login') {
        Write-Host ">>> REDIRECTED BACK TO LOGIN PAGE <<<"
    } else {
        Write-Host ">>> REACHED DASHBOARD <<<"
    }
} catch {
    Write-Host "Error: $_"
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)"
}
