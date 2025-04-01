const express = require('express');
const axios = require('axios');
const router = express.Router();

const CLIENT_ID = '';
const CLIENT_SECRET = '';
const AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/token';

router.get('/getAccessToken', async (req, res) => {
  try {
    const response = await axios.post(
      AUTH_URL,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'data:read viewables:read'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching access token:', error);
    res.status(500).send('Failed to get access token');
  }
});

module.exports = router;
