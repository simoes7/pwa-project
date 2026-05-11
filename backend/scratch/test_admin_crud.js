
const fetch = require('node-fetch');

async function testAdminCRUD() {
  const loginRes = await fetch('http://localhost:3001/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@example.com', password: 'password123' })
  });
  const { token } = await loginRes.json();

  if (!token) {
    console.error('Failed to log in');
    return;
  }

  // 1. Test Create Admin
  const createRes = await fetch('http://localhost:3001/admin/accounts', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Test Admin',
      email: 'testadmin' + Date.now() + '@example.com',
      password: 'password123',
      role: 'admin',
      is_active: true
    })
  });

  const createData = await createRes.json();
  console.log('Create Admin Result:', createData);

  if (createRes.ok) {
    const adminId = createData.admin.id;

    // 2. Test Update Admin
    const updateRes = await fetch(`http://localhost:3001/admin/accounts/${adminId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Updated Admin',
        email: createData.admin.email,
        role: 'admin',
        is_active: true
      })
    });
    console.log('Update Admin Result:', await updateRes.json());

    // 3. Test Delete Admin
    const deleteRes = await fetch(`http://localhost:3001/admin/accounts/${adminId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Delete Admin Result:', await deleteRes.json());
  }
}

testAdminCRUD();
