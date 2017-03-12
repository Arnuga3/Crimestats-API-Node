var express = require("express");
var bodyParser = require("body-parser");
var request = require('request');
var asynch = require('async');
var figlet = require('figlet');
var app = express();


//>>> FUNCTIONS
function c(x) {
  figlet(x, function(err, data) {
      if (err) {
          console.log('Something went wrong...');
          console.dir(err);
          return;
      }
      console.log(data)
  });
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// lat, lng (from a client) to request force, neighbourhood form API
app.post('/neighbourhood', function(req,res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(200, {"Content-Type": "application/json"});

  var lat = req.body.lat;
  var lng = req.body.lng;
  //console.log("Request Coordinates: " + lat + " : " + lng);

  // GET request using 'request'
  request.get({
    headers: {'Content-Type': 'application/json'},
    url: 'https://data.police.uk/api/locate-neighbourhood?q=' + lat + ',' + lng
  }, function(error, response, body){
    //console.log(body);
    // Return to a client
    res.end(body);
  });
});

// lat, lng (from a client) to request force, neighbourhood form API
app.get('/neighbourhood', function(req,res) {

  var lat = req.query.lat;
  var lng = req.query.lng;
  //console.log("Request Coordinates: " + lat + " : " + lng);

  // GET request using 'request'
  request.get({
    headers: {'Content-Type': 'application/json'},
    url: 'https://data.police.uk/api/locate-neighbourhood?q=' + lat + ',' + lng
  }, function(error, response, body){
    //console.log(body);
    // Return to a client
    res.send(body);
  });
});


// Neighbourhood full details
app.post('/neighbourhood/details', function(req,res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(200, {"Content-Type": "application/json"});

  var force = req.body.force;
  var neighbourhood = req.body.neighbourhood;
  //console.log("Requested: " + force + " | " + neighbourhood);

  // GET request using 'request'
  request.get({
    headers: {'Content-Type': 'application/json'},
    url: 'https://data.police.uk/api/' + force + '/' + neighbourhood
  }, function(error, response, body){
    // Return to a client
    res.end(body);
  });
});

// Neighbourhood full details
app.get('/neighbourhood/details', function(req,res) {

  var force = req.query.force;
  var neighbourhood = req.query.neighbourhood;
  //console.log("Requested: " + force + " | " + neighbourhood);

  // GET request using 'request'
  request.get({
    headers: {'Content-Type': 'application/json'},
    url: 'https://data.police.uk/api/' + force + '/' + neighbourhood
  }, function(error, response, body){
    // Return to a client
    res.send(body);
  });
});


// A list of crime categories and numbers
app.post('/crime-cat-data', function(req, res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(200, {"Content-Type": "text/plain"});

  // POST variables
  var obj = JSON.parse(req.body.data);
  var poly = obj.poly;
  var period = obj.period;

  var convertToPoly = function(arr) {
    var poly = '';
    for (var i=0; i<arr.length; i++) {
      if (!i) {
        poly += arr[i].lat + "," + arr[i].lng;
      } else {
        poly += ':' + arr[i].lat + "," + arr[i].lng;
      }
    }
    poly += ':' + arr[0].lat + "," + arr[0].lng;
    poly = poly.replace(/[ ()]/g, "");
    return poly;
  };
  console.log(convertToPoly(poly));
  // GET request using 'request module'
  // Two requests stored in array
  var requests = ['https://data.police.uk/api/crime-categories',
                  'https://data.police.uk/api/crimes-street/all-crime?poly=' + convertToPoly(poly)];
  // Array to store responses
  var responses = [];
  // Array to store crime category names
  var categories = [];
  // Object to store crimes grouped by category
  var crimes = {};


  // First request using 'requset' module - get categories
  request.get({
    headers: {'Content-Type': 'application/json'},
    url: requests[0]
  }, function(error, response, body){
      // Crime categories
      var data = JSON.parse(body);
      // Save names of categories
      for(var i=0; i<data.length; i++) {
        categories.push(data[i].url);
      }

      // Second request - get crimes within a poly
      request.get({
        headers: {'Content-Type': 'application/json'},
        url: requests[1]
      }, function(error, response, body) {
        if(response.statusCode == 200) {
        // Create properties (category names) and add empty arrays to them inside the crimes object
        for(var i=0;i<categories.length; i++) {
          crimes[categories[i]] = [];
        }

        var crimeData = JSON.parse(body);
        // Loop through the crimes
        for(var i=0;i<crimeData.length; i++) {
          // Loop through the categories
          for (var j=0; j<categories.length; j++) {
            // Fill the empty arrays with crimes (skipping unnecessary data)
            if (crimeData[i].category == categories[j]) {
              // Save only id, latitude, longitude
              crimes[crimeData[i].category].push({
                id: crimeData[i].id,
                latitude: crimeData[i].location.latitude,
                longitude: crimeData[i].location.longitude
              });
            }
          }
        }

        // Get back to user!!!
        res.end(JSON.stringify(crimes));

      } else if (response.statusCode == 503) {
        console.log("FAIL");
        console.log("RECOVERY");

        var splitPoly = function(points) {
          var poly1 = [];
          var poly2 = [];

          c("Middle Lat");
          console.log(poly[0].lat);
          console.log(poly[1].lat);
          var middleLat = poly[0].lat - poly[1].lat;
          console.log(middleLat);
          //return poly1;
        }

        var convertFromPoly = function(poly) {
          console.log(poly);
          var polyArr = poly.split(":");
          var points = [];
          for (var i=0; i<polyArr.length-1; i++) {
            //console.log(polyArr[i]);
            var latLng = polyArr[i].split(",");
            points.push({lat: latLng[0], lng: latLng[1]});
          }
          return points;
        }

        var pols = [convertToPoly(splitPoly(convertFromPoly(poly)))];
        console.log("POLY: " + pols[0]);
        asynch.each(pols, function(el, callback) {
          request.get({
            headers: {'Content-Type': 'application/json'},
            url: 'https://data.police.uk/api/crimes-street/all-crime?poly=' + el
          }, function(error, response, body) {
            if(response.statusCode == 200) {
            // Create properties (category names) and add empty arrays to them inside the crimes object
            for(var i=0;i<categories.length; i++) {
              crimes[categories[i]] = [];
            }

            var crimeData = JSON.parse(body);
            // Loop through the crimes
            for(var i=0;i<crimeData.length; i++) {
              // Loop through the categories
              for (var j=0; j<categories.length; j++) {
                // Fill the empty arrays with crimes (skipping unnecessary data)
                if (crimeData[i].category == categories[j]) {
                  // Save only id, latitude, longitude
                  crimes[crimeData[i].category].push({
                    id: crimeData[i].id,
                    latitude: crimeData[i].location.latitude,
                    longitude: crimeData[i].location.longitude
                  });
                }
              }
            }
          }

          });
            callback();

            res.end(JSON.stringify(crimes));
          }, function(err) {

              // Get back to user!!!
          }
        );

      }
    });
  });
});

// A list of crime categories and numbers
app.get('/crime-cat-data', function(req,res) {

  var poly = req.query.poly;
  var period = req.query.period;
  //console.log(poly);
  //console.log("Requested: Crime categories");

  // GET request using 'request'
  var requests = ['https://data.police.uk/api/crime-categories',
                  'https://data.police.uk/api/crimes-street/all-crime?poly=' + poly];
  var responses = [];
  var categories = [];
  var catCounted = [];
  var index = 0;

    request.get({
      headers: {'Content-Type': 'application/json'},
      url: requests[0]
    }, function(error, response, body){
      responses.push(body);

        var data = JSON.parse(responses[0]);
        //console.log(data);
        for(var i=0; i<data.length; i++) {
          categories.push(data[i].url);
        }

        request.get({
          headers: {'Content-Type': 'application/json'},
          url: requests[1]
        }, function(error, response, body){
          responses.push(body);

          for(var i=0;i<categories.length; i++) {
            catCounted.push({cat: [categories[i]], num: 0});
          }

          var crimeData = JSON.parse(responses[1]);
          //console.log(crimeData);
          // Counting crimes
          for(var i=0;i<crimeData.length; i++) {
            for (var j=0; j<catCounted.length; j++) {
              if (crimeData[i].category == catCounted[j].cat)
              catCounted[j].num += 1;
            }
          }
          /* Sorting by number, high to low
          catCounted.sort(function(a, b){
              return b.num-a.num;
          }); */

          // Get back to user!!!
          res.send(JSON.stringify(catCounted));
        });
    });
});


/*


*/

app.get('/', function(req,res) {
  res.send("<h1>Hello to CrimeStats!</h1><br>We are still under development process.");
});

var port = process.env.PORT || 1337;
app.listen(port);
