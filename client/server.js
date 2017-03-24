const express  = require('express');
const settings = require('./config/settings.js');
const path     = require('path');
const app      = express();


app.use(express.static(settings.prodOutput));

app.get('*', function response(req, res) {
  res.sendFile(path.join(settings.prodOutput, req.url));
});

app.listen(settings.hotPort, '0.0.0.0', function(err) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`Listening on: ${settings.hotPort}`);
  console.log(`Serving content from: ${settings.prodOutput}`);
});
