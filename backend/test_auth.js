

async function testAuth() {
  const randomEmail = `test_${Date.now()}@example.com`;
  console.log('Testing Register...');
  const resReq = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: randomEmail, password: 'password123' })
  });
  const registerData = await resReq.json();
  console.log('Register Response:', resReq.status, registerData);

  if (!registerData.token) return;

  console.log('\nTesting Login...');
  const loginReq = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: randomEmail, password: 'password123' })
  });
  const loginData = await loginReq.json();
  console.log('Login Response:', loginReq.status, loginData);

  console.log('\nTesting Get Profile...');
  const profileReq = await fetch('http://localhost:5000/api/auth/profile', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${registerData.token}` }
  });
  const profileData = await profileReq.json();
  console.log('Profile Response:', profileReq.status, profileData);
}

testAuth();
