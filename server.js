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
    //console.log(body);
    // Return to a client
    res.end(body);
  });
});


// A list of crime categories
app.post('/crime-cat-data', function(req,res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(200, {"Content-Type": "text/plain"});

  var poly = req.body.poly;
  console.log(poly);
  console.log("Requested: Crime categories");

  // GET request using 'request'
  var requests = ['https://data.police.uk/api/crime-categories',
                  'https://data.police.uk/api/crimes-street/all-crime?poly=' + poly];
  var responses = [];
  for (i in requests) {
    request.get({
      headers: {'Content-Type': 'application/json'},
      url: requests[i]
    }, function(error, response, body){
      responses.push(body);
    });
  }
  var categories = [];
  console.log("response 0");
  console.log(responses.length);
  var data = JSON.parse(responses[0]);
  for(var i=0; i<data.length; i++) {
    categories.push(data[i].name);
    console.log(data[i].name);
  }
  // Array to store objects with category and number of crimes
  var numOfEachCat = [];
  // Assigning 0 default values to each category
  for(var i=0;i<categories.length; i++) {
    numOfEachCat.push({cat: [categories[i]], num: 0});
  }
  var crimeData = JSON.parse(responses[1]);
  // Counting crimes
  for(var i=1;i<crimeData.length; i++) {
    for (var j=0; j<numOfEachCat.length; j++) {
      if (data[i].category == numOfEachCat[j].cat)
      numOfEachCat[j].num += 1;
    }
  }
  // Sorting by number, high to low
  numOfEachCat.sort(function(a, b){
      return b.num-a.num;
  });
  for(var i=0;i<numOfEachCat.length; i++) {
    console.log("category: " + numOfEachCat[i].cat + " | num: "
      + numOfEachCat[i].num);
  }


});

/*


*/

app.get('/', function(req,res) {
  res.send("Hello to CrimeStats! <br> Documentation is coming...");
});

var port = process.env.PORT || 1337;
app.listen(port);
