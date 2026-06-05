const axios = require('axios');

async function run() {
  try {
    console.log("Attempting to login...");
    const loginRes = await axios.post('http://localhost:8082/api/v1/auth/login', {
      email: 'tested_student@fsa.com',
      password: 'password123'
    });
    
    console.log("Login success!");
    const token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
    console.log("Token:", token ? "FOUND" : "NOT FOUND");
    
    console.log("Fetching completed daily challenges...");
    const completedRes = await axios.get('http://localhost:8082/api/v1/daily-challenges/completed', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Completed response:", JSON.stringify(completedRes.data, null, 2));

    console.log("Fetching daily challenges...");
    const challengesRes = await axios.get('http://localhost:8082/api/v1/daily-challenges', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Challenges response:", JSON.stringify(challengesRes.data, null, 2));
  } catch (err) {
    console.error("Error occurred:", err.response ? {
      status: err.response.status,
      data: err.response.data
    } : err.message);
  }
}

run();
