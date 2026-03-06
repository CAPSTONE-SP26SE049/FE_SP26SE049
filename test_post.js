const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://127.0.0.1:8082/api/v1/auth/login', {
      email: 'nguyenductuan122004@gmail.com',
      password: 'nguyenductuan1220049556@'
    });
    const token = loginRes.data.data.accessToken;
    console.log("Logged in");

    try {
      const res = await axios.post('http://127.0.0.1:8082/api/v1/educator/curriculum/levels', {
        name: "Test new level",
        errorTag: "tone",
        aiThreshold: 80,
        region: "SOUTH"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Level created", res.data);
    } catch (e) {
      console.log("Level creation failed:", e.response ? {status: e.response.status, data: e.response.data} : e.message);
    }
    
    try {
      const res2 = await axios.post('http://127.0.0.1:8082/api/v1/educator/classrooms', {
        name: "Test Classroom"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Classroom created", res2.data);
    } catch (e) {
      console.log("Classroom creation failed:", e.response ? {status: e.response.status, data: e.response.data} : e.message);
    }

  } catch (err) {
    console.error("Login failed", err);
  }
}

test();
