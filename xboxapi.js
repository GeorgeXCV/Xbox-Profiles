const axios = require('axios');
const { config } = require('./config.js')
const database = require('./database');

const authHeader = {'X-AUTH': config.apiKey};

module.exports = {
    // Get Xbox User ID using Gamertag
    getXboxUserID: async function (gamertag) {
        try {
            let userID;
            let newEntry = false;
            // Search Database for username
            await database.XboxProfile.findOne({gamertag: gamertag}, async function (error, profile) {
              if (profile) {
                // If username found, return User ID
                 userID = profile.userID;
              } else {
                // If not in Database, we need to create a new entry
                newEntry = true;
              }
            })
            
            if (newEntry) { 
                const options = {
                    method: 'GET',
                    headers: authHeader,
                    url: `https://xapi.us/v2/xuid/${gamertag}`
                }
                const response = await axios(options);

              // Create new User in the Database
              await database.XboxProfile.create({gamertag: gamertag, userID: response.data.xuid}, async function (error, profile) {
                if (profile) {
                  userID = profile.userID;
                } else if (error) {
                  throw `Failed save new User to Database. Error: ${error}`
                }
              })
          }
          return userID;
        } catch (error) {
            console.log(`Failed to get Xbox User ID. Error: ${error}`)
        }
    },

    // Get Profile - Avatar, Gamerscore etc.
    getXboxUserProfile: async function (userID) {
        try {
            const options = {
                method: 'GET',
                headers: authHeader,
                url: `https://xapi.us/v2/${userID}/new-profile`
            }
            const response = await axios(options);
            if (response) {
                const filter = { userID: userID };
                const update = { gamertag: response.data.gamertag, 
                    gamerScore: response.data.gamerScore, 
                    avatar: response.data.displayPicRaw};
                await database.XboxProfile.findOneAndUpdate(filter, update);
            }
        } catch (error) {
            console.log(`Failed to get Xbox User Profile. Error: ${error}`)
        }
    },

    // Get User's Xbox One Games
    getXboxOneGames: async function (userID) {
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
    },

    // Get User's Xbox 360 Games
    getXbox360Games: async function (userID) {
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
    },

    // Get User's Achievements for given Game
    getGameAchievements: async function  (userID, titleID) {
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
}
