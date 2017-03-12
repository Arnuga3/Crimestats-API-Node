var express = require("express");
var bodyParser = require("body-parser");
var request = require('request');
var asynch = require('async');
var figlet = require('figlet');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//>>>>>>>> THE MAIN METHOD
app.post('/force', function(req, res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.writeHead(200, {"Content-Type": "application/json"});

  // Retrieve a json sent from a browser
  var obj = JSON.parse(req.body.data);
  // centre point latitude
  var lat = obj.center.lat;
  // centre point longitude
  var lng = obj.center.lng;
  // ids of neighbourhoods already displayed on the map
  var onMapIDs = obj.onMapIDs;
  // corners of the map view
  var corners = obj.corners;

  request.get({
    headers: {'Content-Type': 'application/json'},
    url: 'https://data.police.uk/api/locate-neighbourhood?q=' + lat + ',' + lng
  }, function(error, response, body){
    var data = JSON.parse(body);
    var force = data.force;
    //console.log(force);

    request.get({
      headers: {'Content-Type': 'application/json'},
      url: 'https://data.police.uk/api/' + force + '/neighbourhoods'
    }, function(error, response, body){

      var neighbourhoods = JSON.parse(body);
      var responses = [];
      var urls = [];
      var onMapViewNeighb = [];
      var contains = function(a, b) {
        console.log("---->");
        console.log(b.lat + " > " + a.topL.lat);
        console.log(b.lat + " < " + a.botR.lat);
        console.log(b.lng + " > " + a.topL.lng);
        console.log(b.lng + " < " + a.botR.lng);
        console.log("<----");
        console.log(" ");

        return b.lat > a.topL.lat &&
                b.lat < a.botR.lat &&
                b.lng > a.topL.lng &&
                b.lng < a.botR.lng;
      };
      var rectangle = {
        topL: corners[1],
        botR: corners[3]
      };

      for (var i=0; i<neighbourhoods.length; i++) {
        var url = "https://data.police.uk/api/" + force + "/" + neighbourhoods[i].id;
        //console.log(url);
        urls.push(url);
      }
      console.log(urls.length);

      // async module to handle multiple requests and combine all the results
      /*asynch.each(urls, function(url, callback) {
          request(url, function(err, response, body) {
            //console.log(body);
            obj = JSON.parse(body);
            responses.push({id: obj.id, lat: obj.centre.latitude, lng: obj.centre.longitude});

            callback();
          });
        }, function(err) {
          for (var i=0; i<responses.length; i++) {

            console.log(responses[i].id);
          }
          console.log(responses.length);

            //var inside = [];
            /**/
            /*asynch.each(responses, function(el, callback) {
                console.log(contains(rectangle, el));
                if (contains(rectangle, el)) {
                  inside.push(el.id);
                }
              }, function(err) {

                  //console.log(inside.length);

                }

            );


          }
      );*/



      /*request.get({
        headers: {'Content-Type': 'application/json'},
        url: requests[i]
      }, function(error, response, body) {
        var parsed = JSON.parse(body);
        var point = { lat:parsed.centre.latitude,
                      lng: parsed.centre.longitude};
        if (contains(rectangle, point)) {
          onMapViewNeighb.push({id: parsed.id, lat: parsed.centre.latitude, lng: parsed.centre.longitude});
        }
        responses.push({id: parsed.id, lat: parsed.centre.latitude, lng: parsed.centre.longitude});

      });*/

      //console.log(corners);
      /*// If the point inside the map view triangle



      console.log("before");
      for (var i=0; i<responses.length; i++) {
        if (contains(rectangle, responses[i])) {
          onMapViewNeighb.push(responses[i]);
          console.log(onMapViewNeighb[i]);
        }
      }*/

    });
  });

});

//>>>>>>>> END


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
  console.log(JSON.parse(req.body));
  var obj = req.body;
  var poly = obj.poly;
  console.log(poly);
  var period = obj.period;
  console.log(period);
  var convertToPoly = function(arr) {
    var poly = '';
    for (var i=0; i<arr.length; i++) {
      if (!i) {
        poly += arr[i];
      } else {
        poly += ':' + arr[i];
      }
    }
    poly += ':' + arr[0];
    poly = poly.replace(/[ ()]/g, "");
    return poly;
  };

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

        figlet('SUCCESS', function(err, data) {
            if (err) {
                console.log('Something went wrong...');
                console.dir(err);
                return;
            }
            console.log(data)
        });

        // Get back to user!!!
        res.end(JSON.stringify(crimes));

      } else if (response.statusCode == 503) {
        console.log("FAIL");
        console.log("RECOVERY");

        var splitPoly = function(points) {
          var poly1 = [];
          var poly2 = [];

          console.log("POINTS: ");

          console.log(points[1].lat);
          console.log(points[0].lat);
          console.log(">>>");
          console.log();

          var middleLat = points[1].lng - points[0].lng;
          poly1.push(points[0].lat + "," + points[0].lng);
          console.log(poly1[0]);
          poly1.push(middleLat + "," + points[0].lng);
          console.log(poly1[1]);
          poly1.push(middleLat + "," + points[3].lng);
          console.log(poly1[2]);
          poly1.push(points[3].lat + "," + points[3].lng);
          console.log(poly1[3]);
          return poly1;
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
