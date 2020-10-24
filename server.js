const express = require('express');
const app = express();

const port = process.env.PORT || 80;

app.set('views', __dirname);
app.use(express.static(__dirname));

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
  });