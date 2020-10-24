const axios = require('axios');
const { config } = require('./config.js')

const authHeader = {'X-AUTH': config.apiKey};

// Get Xbox User ID using Gamertag
async function getXboxUserID (gamertag) {
    try {
         const options = {
             method: 'GET',
             headers: authHeader,
             url: `https://xapi.us/v2/xuid/${gamertag}`
         }
         const response = await axios(options);
         return response.data;
    } catch (error) {
        console.log(`Failed to get Xbox User ID. Error: ${error}`)
    }
}

// Get Profile - Avatar, Gamerscore etc.
async function getXboxUserProfile (userID) {
    try {
         const options = {
             method: 'GET',
             headers: authHeader,
             url: `https://xapi.us/v2/${userID}/new-profile`
         }
         const response = await axios(options);
         return response.data;
    } catch (error) {
        console.log(`Failed to get Xbox User Profile. Error: ${error}`)
    }
}

// Get User's Xbox One Games
async function getXboxOneGames (userID) {
    try {
         const options = {
             method: 'GET',
             headers: authHeader,
             url: `https://xapi.us/v2/${userID}/xboxonegames`
         }
         const response = await axios(options);
         return response.data;
    } catch (error) {
        console.log(`Failed to get User's Xbox One Games. Error: ${error}`)
    }
}


// Get User's Xbox 360 Games
async function getXbox360Games (userID) {
    try {
         const options = {
             method: 'GET',
             headers: authHeader,
             url: `https://xapi.us/v2/${userID}/xbox360games`
         }
         const response = await axios(options);
         return response.data;
    } catch (error) {
        console.log(`Failed to get User's Xbox 360 Games. Error: ${error}`)
    }
}

// Get User's Achievements for given Game
async function getGameAchievements (userID, titleID) {
    try {
         const options = {
             method: 'GET',
             headers: authHeader,
             url: `https://xapi.us/v2/${userID}/achievements/${titleID}`
         }
         const response = await axios(options);
         return response.data;
    } catch (error) {
        console.log(`Failed to get User's Achievemnts for given Game. Error: ${error}`)
    }
}
