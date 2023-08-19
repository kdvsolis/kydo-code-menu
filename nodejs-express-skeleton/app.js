"use strict"

require("./config/config")

const express = require('express');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const handleErrors = require('./middlewares/handle-errors.middleware');
const cors = require('./middlewares/cors.middleware');


const port = process.env.PORT || 3000;
const routePath = './routes/';
const app = express();

// Settings
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors);

// Load Routes Dynamically
fs.readdirSync(routePath).forEach(function (file) {
  const routeFile = require(routePath + file);
  app.use('/v1', routeFile);
});
app.use(handleErrors);

app.get('/', function (req, res) {
  res.status(200).send({success: true});
});

if(typeof process.env.APP_ENVIRONMENT == "undefined"){
  app.listen(port, process.env.HOST, function () {
    console.log("The server is listening at http://" + process.env.HOST + ":" + port)
  });
} else {
  app.listen(port, function() {
    console.log("The server is listening in port: " + port)
  })
}

module.exports = app;
