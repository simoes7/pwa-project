$json = '{"role":"super_admin"}'
Invoke-RestMethod -Uri "http://localhost:3001/admin/accounts/112" -Method PUT -ContentType "application/json" -Body $json
