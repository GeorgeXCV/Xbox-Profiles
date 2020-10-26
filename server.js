const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const moment = require('moment');
app.locals.moment = require('moment');
const database = require('./database');
const xboxAPI = require('./xboxapi');

function runAsyncWrapper (callback) {
    return function (req, res, next) {
      callback(req, res, next)
        .catch(next)
    }
  }

const port = process.env.PORT || 80;

app.set('view engine', 'ejs');
app.set('views', __dirname);
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true })); 

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/:username/achievements/:game/:titleID', runAsyncWrapper(async(req, res) => { 
 
  const username = req.params.username
  const titleID = req.params.titleID  

  // Search Database for Gamertag to get their User ID
  await database.XboxProfile.findOne({gamertag: username}, async function (error, xboxProfile) {
    if (xboxProfile) {
       // With User ID found, request their achievements for game using Title ID param
       const achievements = await xboxAPI.getPlayerGameAchievements(xboxProfile.userID, titleID);
       const gameIndex = xboxProfile.Games.findIndex(game => game.titleId == titleID);
       res.render('achievements.ejs', {
         profile: xboxProfile,
         game: xboxProfile.Games[gameIndex],
         achievements: achievements.achievements
      })
    } else {
      return res.status(404).sendFile(__dirname + '/error.html');
    } 
  })

 }));

app.get('/:username', runAsyncWrapper(async(req, res) => {
    const username = req.params.username
    await database.XboxProfile.findOne({gamertag: username}, async function (error, user) {
      if (user) {
         res.render('profile.ejs', {profile: user})
      } else {
        return res.redirect('/?gamertag=' + username);
      } 
    })
}))

app.post('/getuser', runAsyncWrapper(async(req, res) => {
    const gamertag = req.body.gamertag
    const userID = await xboxAPI.getXboxUserID(gamertag); // Need User ID to get Information
    
    if (userID) {
        await xboxAPI.getXboxUserProfile(userID); // Get Gamerscore, Avatar etc
        await xboxAPI.getGames(userID);
        return res.status(200).send({result: 'redirect', url: `${gamertag}`})
    } else {
        return res.status(404).sendFile(__dirname + '/error.html');
    }
    
}))

  