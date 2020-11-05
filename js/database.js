//Import the mongoose module
const mongoose = require('mongoose');

//Set up default mongoose connection
const devURL = "mongodb://localhost:27017/XboxProfiles"
mongoose.connect(process.env.MONGODB_URL|| devURL, {useNewUrlParser: true, useUnifiedTopology: true});

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

db.once('open', function() {
    console.log("Database Live!")

    const XboxProfileSchema = new mongoose.Schema({
        gamertag: {
            type: String,
            required: true,
        },
        userID: {
            type: String,
            required: true,
            index: {
                unique: true,
            }
        },
        avatar: String,
        gamerScore: String,
        completedGames: String,
        totalAchievements: String,
        unearnedGamerscore: String,
        avgCompletion: String,
        Games: {
            type: Array
        }
    }, {
       collation: {locale: 'en', strength: 2} // Allow case insensitive queries to work
    })
    
    module.exports.XboxProfile = mongoose.model('XboxProfile', XboxProfileSchema);
  });