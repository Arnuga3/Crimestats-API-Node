var express = require("express");
var bodyParser = require("body-parser");
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// lat, lng (from a client) to request force, neighbourhood form API
app.post('/neighbourhood', function(req,res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(200, {"Content-Type": "application/json"});

  var lat = req.body.lat;
  var lng = req.body.lng;
  console.log("Request Coordinates: " + lat + " : " + lng);

  // GET request using 'request'
  request.get({
    headers: {'Content-Type': 'application/json'},
    url: 'https://data.police.uk/api/locate-neighbourhood?q=' + lat + ',' + lng
  }, function(error, response, body){
    console.log(body);
    // Return to a client
    res.end(body);
  });
});


// Neighbourhood full details
app.post('/neighbourhood/details', function(req,res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(200, {"Content-Type": "application/json"});

  var force = req.body.force;
  var neighbourhood = req.body.neighbourhood;
  console.log("Requested: " + force + " | " + neighbourhood);

  // GET request using 'request'
  request.get({
    headers: {'Content-Type': 'application/json'},
    url: 'https://data.police.uk/api/' + force + '/' + neighbourhood
  }, function(error, response, body){
    console.log(body);
    // Return to a client
    res.end(body);
  });
});


// A list of crime categories
app.post('/crime-categories', function(req,res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(200, {"Content-Type": "application/json"});

  console.log("Requested: Crime categories");

  // GET request using 'request'
  request.get({
    headers: {'Content-Type': 'application/json'},
      url: 'https://data.police.uk/api/crime-categories'
    }, function(error, response, body){
      console.log(body);
      var cats = [];
      for(var i=0;i<body.length; i++) {
        cats.push(body[i].url);
      }
    // Return to a client
    res.end(JSON.stringify(cats));
  });
});


app.get('/', function(req,res) {
  res.send("Hello to CrimeStats! <br> Documentation is coming...");
});

var port = process.env.PORT || 1337;
app.listen(port);
