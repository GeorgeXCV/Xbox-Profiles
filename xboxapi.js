const axios = require('axios');
const { authHeaderOpenXBL, authHeaderXboxAPI } = require('./config.js')
const database = require('./database');

module.exports = {
    // Get Xbox User ID using Gamertag
    getXboxUserID: async function (gamertag) {
        try {
            let userID;
            userID = await this.checkIfExistingUser(gamertag);
             if (!userID) { 
                // Get User ID if we don't already have it
                userID = await this.getXUID(gamertag); 
                // Create new User in the Database
                await database.XboxProfile.create({gamertag: gamertag, userID: userID}, async function (err, profile) {
                if (profile) {
                    userID = profile.userID
                } else if (err) {
                    throw 'Failed to save to new user to database: ' + err
                }
              })
            }
          return userID;
        } catch (error) {
            console.log(`Failed to get Xbox User ID. Error: ${error}`)
        }
    },

    // Xbox User ID
    getXUID: async function (gamertag) {
        try {
            const options = {
                method: 'GET',
                headers: authHeaderXboxAPI,
                url: `https://xapi.us/v2/xuid/${gamertag}`
            }
            const response = await axios(options);
            return response.data.xuid;
        } catch (error) {
            console.log(`Failed to get XUID. Error: ${error}`)
        }
    },

    checkIfExistingUser: async function (gamertag) {
        try {
          let userID;
            // Search Database for username
            await database.XboxProfile.findOne({gamertag: gamertag}, async function (error, profile) {
              if (profile) {
                 userID = profile.userID;
              } else {
                // If not in Database, we need to create a new entry
                return false
              }
            })
          return userID;
        } catch (error) {
          console.log("Failed to check if exisiting user. Error: " + error);
        }
      },

    // Get Profile - Avatar, Gamerscore etc.
    getXboxUserProfile: async function (userID) {
        try {
            const options = {
                method: 'GET',
                headers: authHeaderXboxAPI,
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
                headers: authHeaderOpenXBL,
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
            let completedGames = 0;
            let totalAchievements = 0;
            let percentages = [];
            let unearnedGamerscore = 0;
            const gamesList = await this.getOverallAchievements(userID);
            if (gamesList) {
                allGames = gamesList.titles
                while (index < allGames.length) {
                    // Delete non achievement applications - Beta, Demos etc
                    if (allGames[index].achievement.totalGamerscore == "0") {
                        allGames.splice(index, 1);
                        index--;
                    } else {
                         // Set proper platform name based on what Device array has
                        if (allGames[index].devices[0].includes("One")) {
                            allGames[index].platform = "Xbox One"
                        } else if (allGames[index].devices[0].includes("360")) {
                            allGames[index].platform = "Xbox 360"
                        } else {
                            allGames[index].platform = "PC"
                        }
                        // Track total achivements earned
                        if (allGames[index].achievement.currentAchievements > 0) {
                            totalAchievements+= allGames[index].achievement.currentAchievements
                        }
                        // Save each percentage to calculate average completion rate
                        percentages.push(allGames[index].achievement.progressPercentage);
                        // Track how many games are 100%
                        if (allGames[index].achievement.progressPercentage == "100") {
                            completedGames++;
                            }
                        }
                        // Track unearend Gamerscore
                        if (allGames[index].achievement.currentGamerscore !== allGames[index].achievement.totalGamerscore) {
                            unearnedGamerscore += allGames[index].achievement.totalGamerscore - allGames[index].achievement.currentGamerscore
                        }
                        ++index;
                    }                   
                }
            const average = (array) => array.reduce((a, b) => a + b) / array.length;
            const avgPercentage = average(percentages).toFixed(2);

            const filter = { userID: userID };
            const update = {
                Games: allGames, 
                completedGames: completedGames,
                totalAchievements: totalAchievements,
                avgCompletion: avgPercentage,
                unearnedGamerscore: unearnedGamerscore
            }; 
            await database.XboxProfile.findOneAndUpdate(filter, update);
            return true;
        } catch (error) {
            console.log(`Failed to get Games. Error: ${error}`)
            return false;
        }
    },

    getPlayerGameAchievements: async function (userID, titleID, xbox360 = false) {
        try {
            let options = {
                method: 'GET',
                headers: authHeaderOpenXBL,
                url: `https://xbl.io/api/v2/achievements/player/${userID}/title/${titleID}`
            }
            // Have to use different API to get Xbox 360 Achievements
            if (xbox360 === true) {
                options.headers = authHeader
                options.url = `https://xapi.us/v2/${userID}/achievements/${titleID}`
            }
            const response = await axios(options);
            if (response) {
                return response.data;
            }
        } catch (error) {
            console.log(`Failed to get Player's Game Achievements. Error: ${error}`)
        }
    },

    // Get User's Xbox One Games
    getXboxOneGames: async function (userID) {
        try {
            const options = {
                method: 'GET',
                headers: authHeaderXboxAPI,
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
                headers: authHeaderXboxAPI,
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
}
