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

    // Returns list of Games with surface level Achievement stats
    getOverallAchievements: async function (userID) {
        try {
            const options = {
                method: 'GET',
                headers: {"X-Authorization": config.otherAPI},
                url: `https://xbl.io/api/v2/achievements/player/${userID}`
            }
            const response = await axios(options);
            if (response) {
                return response.data;
            }
        } catch (error) {
            console.log(`Failed to get Overall Achievements. Error: ${error}`)
        }
    },

    getGames: async function  (userID) {
        try {
            let allGames;
            let index = 0;
            const gamesList = await this.getOverallAchievements(userID);
            if (gamesList) {
                allGames = gamesList.titles
                // If name includes Beta or Demo, delete entry
                while (index < allGames.length) {
                    if (allGames[index].name.includes("Beta") || allGames[index].name.includes("Demo")) {
                        allGames.splice(index, 1)
                    } else {
                        // Set proper platform name based on what Device array has
                        if (allGames[index].devices.includes("XboxOne")) {
                            allGames[index].platform = "Xbox One"
                        } else {
                            allGames[index].platform = "Xbox 360"
                        }
                        ++index;
                    }
                }
            }
            const filter = { userID: userID };
            const update = {Games: allGames}; 
            await database.XboxProfile.findOneAndUpdate(filter, update);
        } catch (error) {
            console.log(`Failed to get Games. Error: ${error}`)
        }
    },

    getAllXboxGames: async function (userID) {
        try {
            let allGames;
            let index = 0;
            const xboxOneGames = await this.getXboxOneGames(userID);
            const xbox360Games = await this.getXbox360Games(userID);
         
            if (xboxOneGames) {
                allGames = xboxOneGames.titles;
                while (index < allGames.length) {
                    // If title type does not include game, delete it
                    if (!allGames[index].titleType.includes("Game")) { 
                        allGames.splice(index, 1)
                    } else {
                         // Platform data never correct, either codename "Durango" or "XboxOne" (no space)
                         allGames[index].platform = "Xbox One"
                         ++index;
                    }
                }
            }
            if (xbox360Games) {
                if (allGames) {
                    // Loop through 360 Games add them to our Games array
                    for (let index = 0; index < xbox360Games.titles.length; index++) { 
                        // Change some names to match Xbox One format
                        xbox360Games.titles[index].earnedAchievements = xbox360Games.titles[index].currentAchievements
                        xbox360Games.titles[index].maxGamerscore = xbox360Games.titles[index].totalGamerscore
                        xbox360Games.titles[index].platform = "Xbox 360" // Might need to change
                        delete xbox360Games.titles[index].currentAchievements;
                        delete xbox360Games.titles[index].totalGamerscore;

                        allGames.push(xbox360Games.titles[index]);
                    }
                } else {
                    allGames = xbox360Games.titles;
                }
            }
            
            const filter = { userID: userID };
            const update = {Games: allGames}; 
            await database.XboxProfile.findOneAndUpdate(filter, update);

        } catch (error) {
            console.log(`Failed to get all User's Games. Error: ${error}`)
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
            if (response) {
               return response.data;
            }
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
            if (response) {
                return response.data;
            }
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
