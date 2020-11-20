const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const app = express();
const database = require('./database');
const xboxAPI = require('./xboxapi');
const path = require('path');
const moment = require('moment');
app.locals.moment = require('moment');

function runAsyncWrapper (callback) {
    return function (req, res, next) {
      callback(req, res, next)
        .catch(next)
    }
  }

const pagesPath = path.resolve(__dirname, '..', 'pages');
const publicPath = path.resolve(__dirname, '..', 'public');
const errorPagePath = path.resolve(pagesPath, 'error.html');
app.set('view engine', 'ejs');
app.set('views', pagesPath);
app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(compression()); //Compress all routes
app.use(helmet({
  contentSecurityPolicy: false, // Breaks images if true
}));

const port = process.env.PORT || 80;

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

app.get('/', function (req, res) {
    const indexPath = path.resolve(pagesPath, 'index.html');
    res.sendFile(indexPath);
});

app.get('/:username/achievements/:game/:titleID', runAsyncWrapper(async(req, res) => { 
 
  const username = req.params.username
  const titleID = req.params.titleID  
  let achievements = {};

  // Search Database for Gamertag to get their User ID
  await database.XboxProfile.findOne({gamertag: username}, async function (error, xboxProfile) {
    if (xboxProfile) {
      const gameIndex = xboxProfile.Games.findIndex(game => game.titleId == titleID);
      // Check if platform is Xbox 360:
      if (xboxProfile.Games[gameIndex].platform == "Xbox 360") {
        // Make other API request to get achievements because main one doesn't work for 360 titles
        achievements.achievements = await xboxAPI.getPlayerGameAchievements(xboxProfile.userID, titleID, true);
      } else { // Else use better API for achievements request
        achievements = await xboxAPI.getPlayerGameAchievements(xboxProfile.userID, titleID);
      }
      if (achievements.length < 1) {
        return res.status(404).sendFile(errorPagePath);
      } else {
        res.render('achievements.ejs', {
          profile: xboxProfile,
          game: xboxProfile.Games[gameIndex],
          achievements: achievements.achievements
       })
      }
    } else {
      return res.status(404).sendFile(errorPagePath);
    } 
  })
 }));


app.get('/:username', runAsyncWrapper(async(req, res) => {
    const username = req.params.username
    if (username.includes(".css")) { // Block direct access to CSS files
      return res.status(404).sendFile(errorPagePath);
    }
    await database.XboxProfile.findOne({gamertag: username}, async function (error, user) {
      // Check User's full profile is in Database, not just ID because Profile was Private
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
        const games = await xboxAPI.getGames(userID);
        if (games) {
         return res.status(200).send({result: 'redirect', url: `${gamertag}`})
        } else {
         return res.status(404);
        }
    } else {
        return res.status(404).sendFile(errorPagePath);
    }
}))

app.use(function(req,res){
  return res.status(404).sendFile(errorPagePath);
});