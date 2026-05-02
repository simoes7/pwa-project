$body = @{
    role = "super_admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/admin/accounts/112" -Method PUT -ContentType "application/json" -Body $body
