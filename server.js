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
  var categories = [];
  var catCounted = [];
  var index = 0;

  for (var i=0, index=i; i<requests.length; i++) {
      request.get({
      headers: {'Content-Type': 'application/json'},
      url: requests[index]
    }, function(error, response, body){
      responses.push(body);
      console.log("Index: " + index);
      if (index == 0) {

        var data = JSON.parse(responses[0]);
        for(var i=0; i<data.length; i++) {
          categories.push(data[i].name);
          console.log(data[i].name);
        }

      } else if (index == 1) {

        for(var i=0;i<categories.length; i++) {
          catCounted.push({cat: [categories[i]], num: 0});
        }
        var crimeData = JSON.parse(responses[1]);
        // Counting crimes
        for(var i=1;i<crimeData.length; i++) {
          for (var j=0; j<catCounted.length; j++) {
            if (data[i].category == catCounted[j].cat)
            catCounted[j].num += 1;
          }
        }
        // Sorting by number, high to low
        catCounted.sort(function(a, b){
            return b.num-a.num;
        });
        for(var i=0;i<catCounted.length; i++) {
          console.log("category: " + catCounted[i].cat + " | num: "
            + catCounted[i].num);
        }
      }

    });
    index++;
  }

});

/*


*/

app.get('/', function(req,res) {
  res.send("Hello to CrimeStats! <br> Documentation is coming...");
});

var port = process.env.PORT || 1337;
app.listen(port);
