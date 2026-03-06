const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://127.0.0.1:8082/api/v1/auth/login', {
      email: 'nguyenductuan122004@gmail.com',
      password: 'nguyenductuan1220049556@'
    });
    const token = loginRes.data.data.accessToken;

    const res = await axios.get('http://127.0.0.1:8082/api/v1/educator/curriculum/SOUTH', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(res.data, null, 2));

    try {
      const res2 = await axios.get('http://127.0.0.1:8082/api/v1/admin/dialects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Dialects:", JSON.stringify(res2.data, null, 2));
    } catch (e) {}

  } catch (err) {
    console.error("Failed", err.message);
  }
}

test();
