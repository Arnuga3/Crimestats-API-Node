/*
  CRIMESTATS GROUP PROJECT
  A NODE JS SERVER AS A BASIC API -
  Accepts client requests, fetches data from the Police UK API,
    filters the results and sends them back to the client.
*/

// Add modules
var express = require("express");
var bodyParser = require("body-parser");
var request = require('request');
var async = require('async');
var figlet = require('figlet');
var app = express();


/*
  >>>>>> FUNCTIONS
*/

// Fancy text output in console
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
/* Converting array of coordinates to Police API format
   example: lat,lng:lat,lng - where the first and the last points are the same, to lock the poly
*/
function convertToPoly(arr) {
  var poly = '';
  for (var i=0; i<arr.length; i++) {
    // First pair
    if (!i) {
      poly += arr[i].lat + "," + arr[i].lng;
    // Other pairs
    } else {
      poly += ':' + arr[i].lat + "," + arr[i].lng;
    }
  }
  // Add the first pair to the end to loc kthe poly
  poly += ':' + arr[0].lat + "," + arr[0].lng;
  // Remove symbols what may break the http request
  poly = poly.replace(/[ ()]/g, "");
  return poly;
}

/*
  SPLIT functions below are used to split the map view area into smaller areas.
  The main purpose is to expand the Police UK APIlimitation of 10000 crimes.
  Theoretically it is expanded to 80000 crime records, 10000 per each request
  8 x 10000

  1. At first, one request is sent to the Police UK API, using the 4 corner coordinates of the map view.
  2. If 503 error is returned in response (requested more than 10000 crime records),
    the map view is sliced on half and 2 separate requests are send to the Police UK API.
  3. If 503 error is returned in any of the 2 responses,
    the map view is sliced on 4 areas and 4 separate requests are send to the server.
  4. If 503 error is returned in any of the 4 responses,
    the map view is sliced on 8 areas and 8 separate requests are send to the server.
  5. All reponse results are combined together if all requests are successful,
    combined data is filtered, formatted and sent to the client
*/

// Accepts 4 points of a map view and slices the view on half
function splitOn2(bigPoly) {
  // Arrays to store sliced polys
  var poly1 = [];
  var poly2 = [];
  // Getting a middle point
  var middleLng = bigPoly[0].lng + (bigPoly[1].lng - bigPoly[0].lng)/2;

  /* Adding new corner point of each new poly into an array */
  // First poly
  poly1.push(bigPoly[0]);
  poly1.push({lat: bigPoly[1].lat, lng: middleLng});
  poly1.push({lat: bigPoly[2].lat, lng: middleLng});
  poly1.push(bigPoly[3]);

  // Second poly
  poly2.push({lat: bigPoly[0].lat, lng: middleLng});
  poly2.push(bigPoly[1]);
  poly2.push(bigPoly[2]);
  poly2.push({lat: bigPoly[3].lat, lng: middleLng});

  return [poly1, poly2];
}

// Accepts 4 points of a map view and slices the view on 4 polys
function splitOn4(bigPoly) {
  // Sets to store the results of splitOn2 function
  var set1 = [];
  var set2 = [];

  var bigPolyHalves = splitOn2(bigPoly);
  set1 = splitOn2(bigPolyHalves[0]);
  set2 = splitOn2(bigPolyHalves[1]);

  // Return 4 polys
  return [set1[0], set1[1], set2[0], set2[1]];
}

// Accepts 4 points of a map view and slices the view on 8 polys
function splitOn8(bigPoly) {
  // Getting a set of 4 polys and slice each poly on half
  var setOf4 = splitOn4(bigPoly);
  var pair1 = splitOn2(setOf4[0]);
  var pair2 = splitOn2(setOf4[1]);
  var pair3 = splitOn2(setOf4[2]);
  var pair4 = splitOn2(setOf4[3]);

  // Return 8 polys
  return [pair1[0], pair1[1], pair2[0], pair2[1], pair3[0], pair3[1], pair4[0], pair4[1]];
}

/*
  >>>>>> END FUNCTIONS
*/

// Use bodyParser module
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



/* POST http request handler -
  Accepts lat, lng coordinate and returns a police force (fetching data from the Police UK API)
*/
app.post('/neighbourhood', function(req,res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(200, {"Content-Type": "application/json"});

  // Coordinates sent from a client
  var lat = req.body.lat;
  var lng = req.body.lng;

  // GET request, using 'request' module
  request.get({
    headers: {'Content-Type': 'application/json'},
    url: 'https://data.police.uk/api/locate-neighbourhood?q=' + lat + ',' + lng
  }, function(error, response, body){
    // Return to a client
    res.end(body);
  });
});

/* GET http request handler -
  Accepts lat, lng coordinate and returns a police force (fetching data from the Police UK API)
*/
app.get('/neighbourhood', function(req,res) {

  // Coordinates sent from a client (from URL)
  var lat = req.query.lat;
  var lng = req.query.lng;

  // GET request, using 'request' module
  request.get({
    headers: {'Content-Type': 'application/json'},
    url: 'https://data.police.uk/api/locate-neighbourhood?q=' + lat + ',' + lng
  }, function(error, response, body){
    // Return to a client
    res.send(body);
  });
});


/* POST http request handler -
  Accepts police force and neighbourhood, returns a full details of the neighbourhood
*/
app.post('/neighbourhood/details', function(req,res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(200, {"Content-Type": "application/json"});

  // Data from the client
  var force = req.body.force;
  var neighbourhood = req.body.neighbourhood;

  // GET request, using 'request' module
  request.get({
    headers: {'Content-Type': 'application/json'},
    url: 'https://data.police.uk/api/' + force + '/' + neighbourhood
  }, function(error, response, body){
    // Return to a client
    console.log(body.locations[0]);
    res.end(body);
  });
});

/* GET http request handler -
  Accepts police force and neighbourhood, returns a full details of the neighbourhood
*/
app.get('/neighbourhood/details', function(req,res) {

  // Data from the client (from URL)
  var force = req.query.force;
  var neighbourhood = req.query.neighbourhood;

  // GET request, using 'request' module
  request.get({
    headers: {'Content-Type': 'application/json'},
    url: 'https://data.police.uk/api/' + force + '/' + neighbourhood
  }, function(error, response, body){
    // Return to a client
    res.send(body);
  });
});


/* POST http request handler -
  Accepts a poly and the date, returns an object with a list of the crime categories,
  where each category contains an array of crimes from specified poly and date.
*/
app.post('/crime-cat-data', function(req, res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(200, {"Content-Type": "text/plain"});

  // POST variables from a client
  var obj = JSON.parse(req.body.data);
  var poly = obj.poly;
  var month = obj.month;

  // GET request, using 'request' module
  /* Two requests stored in array.
    1. Requests a list of categories (always dynamic to changes)
    2. Requests crime data within a specified poly and date
  */
  var requests = ['https://data.police.uk/api/crime-categories',
                  'https://data.police.uk/api/crimes-street/all-crime?poly=' + convertToPoly(poly) + '&date=' + month];
  // Array to store responses from the both requests
  var responses = [];
  // Array to store crime category names
  var categories = [];
  // Array to store the crime data from different requests (after map view splits)
  var splitResponses = [];
  // Object to store crimes grouped by categories
  var crimes = {};

  // First request - getting crime categories, using 'requset' module
  request.get({
    headers: {'Content-Type': 'application/json'},
    // Requests crime categories
    url: requests[0]
  }, function(error, response, body){
      // Crime categories
      var data = JSON.parse(body);
      // Save names of categories
      for(var i=0; i<data.length; i++) {
        categories.push(data[i].url);
      }
      // Second request - get crimes within a poly and date
      request.get({
        headers: {'Content-Type': 'application/json'},
        // Request crime data
        url: requests[1]
      }, function(error, response, body) {

        // Total amount of crimes is up to 10000
        if(response.statusCode == 200) {
          // Create properties (category names) and add empty arrays to them inside the 'crimes' main object
          for(var i=0;i<categories.length; i++) {
            crimes[categories[i]] = [];
          }

          var crimeData = JSON.parse(body);
          // Loop through the crimes
          for(var i=0;i<crimeData.length; i++) {
            // Loop through the categories
            for (var j=0; j<categories.length; j++) {
              // Fill the empty arrays with crimes (filtering unnecessary data)
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
          // Print in console what results a just from one poly, 10000 limit is not exceeded
          c("CRIMES FROM 1");
          // Return to a client
          res.end(JSON.stringify(crimes));

        // Total amount of crimes is bigger than 10000
        } else if (response.statusCode == 503) {

          console.log("POLY(1) FAILED - 503");
          console.log("TRYING TO CUT ON 2");
          // Clear the response array
          splitResponses = [];

          // Splitting the poly on 2
          var slicedPoly = splitOn2(poly);
          // Add both to an array
          var pols = [convertToPoly(slicedPoly[0]), convertToPoly(slicedPoly[1])];

          // Send 2 requests using 2 new polys, using the 'async' module
          async.each(pols, function(el, callback) {
            request.get({
              headers: {'Content-Type': 'application/json'},
              url: 'https://data.police.uk/api/crimes-street/all-crime?poly=' + el + '&date=' + month
            }, function(error, response, body) {
              if(response.statusCode == 200) {
                  var crimeData = JSON.parse(body);
                  splitResponses.push(JSON.parse(body));
                  console.log("TOTAL NUMBER OF CRIMES FROM <2> REQUESTS: " + crimeData.length);
                  callback();
              // On fail of the any of the requests, stop other requests
              } else if (response.statusCode == 503) {
                  var err = new Error('Broke out of async');
                  err.break = true;
                  return callback(err);
              }
            });
          }, function(err) {

            if (err && err.break) {

              console.log("POLY(2) FAILED - 503");
              console.log("TRYING TO CUT ON 4");
              // Clear the reponse array
              splitResponses = [];

              // Splitting the poly on 4
              var slicedPoly = splitOn4(poly);
              // Add all 4 to an array
              var pols = [convertToPoly(slicedPoly[0]), convertToPoly(slicedPoly[1]),
                          convertToPoly(slicedPoly[2]), convertToPoly(slicedPoly[3])];

              // Send 4 requests using 4 new polys, using the 'async' module
              async.each(pols, function(el, callback) {
                request.get({
                  headers: {'Content-Type': 'application/json'},
                  url: 'https://data.police.uk/api/crimes-street/all-crime?poly=' + el
                }, function(error, response, body) {
                  if(response.statusCode == 200) {
                      var crimeData = JSON.parse(body);
                      splitResponses.push(crimeData);
                      console.log("TOTAL NUMBER OF CRIMES FROM <4> REQUESTS: " + crimeData.length);
                      callback();
                  // On fail of the any of the requests, stop other requests
                  } else if (response.statusCode == 503) {
                    var err = new Error('Broke out of async');
                    err.break = true;
                    return callback(err);
                  }
                });

              }, function(err) {

                if (err && err.break) {

                  console.log("POLY(4) FAILED - 503");
                  console.log("TRYING TO CUT ON 8");
                  // Clear the response arrays
                  splitResponses = [];

                  // Splitting the poly on 8
                  var slicedPoly = splitOn8(poly);
                  // Add all 8 to an array
                  var pols = [convertToPoly(slicedPoly[0]), convertToPoly(slicedPoly[1]),
                              convertToPoly(slicedPoly[2]), convertToPoly(slicedPoly[3]),
                              convertToPoly(slicedPoly[4]), convertToPoly(slicedPoly[5]),
                              convertToPoly(slicedPoly[6]), convertToPoly(slicedPoly[7])];

                  // Send 8 requests using 8 new polys, using the 'async' module
                  async.each(pols, function(el, callback) {
                    request.get({
                      headers: {'Content-Type': 'application/json'},
                      url: 'https://data.police.uk/api/crimes-street/all-crime?poly=' + el
                    }, function(error, response, body) {
                      if(response.statusCode == 200) {
                          var crimeData = JSON.parse(body);
                          splitResponses.push(crimeData);
                          console.log("TOTAL NUMBER OF CRIMES FROM <8> REQUESTS: " + crimeData.length);
                          callback();
                      } else if (response.statusCode == 503) {

                        var err = new Error('Broke out of async');
                        err.break = true;
                        return callback(err);

                        console.log(response.statusCode);
                      }
                    });

                  }, function(err) {

                    if (err && err.break) {
                        c("REQUEST FAILED");
                        // Handle break out of async here
                     } else {

                         // Create properties (category names) and add empty arrays to them inside the 'crimes' object
                         for(var i=0;i<categories.length; i++) {
                           crimes[categories[i]] = [];
                         }

                         // Organise and filter the crime data
                         async.each(splitResponses, function(resp, callback) {
                           var crimeData = resp;
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
                           callback();
                         }, function(err) {
                             c("CRIMES FROM 8");
                             // Get back to user!!!
                             res.end(JSON.stringify(crimes));
                         });
                     }
                  });
                } else {

                    // Create properties (category names) and add empty arrays to them inside the crimes object
                    for(var i=0;i<categories.length; i++) {
                      crimes[categories[i]] = [];
                    }
                    // Organise and filter the crime data
                    async.each(splitResponses, function(resp, callback) {
                      var crimeData = resp;
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
                      callback();
                    }, function(err) {
                        c("CRIMES FROM 4");
                        // Get back to user!!!
                        res.end(JSON.stringify(crimes));
                    });
                  }
              });

             } else {

                 // Create properties (category names) and add empty arrays to them inside the crimes object
                 for(var i=0;i<categories.length; i++) {
                   crimes[categories[i]] = [];
                 }
                 // Organise and filter the crime data
                 async.each(splitResponses, function(resp, callback) {
                   var crimeData = resp;
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
                   callback();
                 }, function(err) {
                     c("CRIMES FROM 2");
                     // Get back to user!!!
                     res.end(JSON.stringify(crimes));
                 });
             }
          });
        }
    });
  });
});

/* GET http request handler -
  is not yet added
*/
app.get('/crime-cat-data', function(req,res) {

  var poly = req.query.poly;
  var period = req.query.period;

});


app.get('/', function(req,res) {
  res.send("<h1>Hello to CrimeStats!</h1><br>Documetation is still under the development process.");
});

var port = process.env.PORT || 1337;
app.listen(port);
