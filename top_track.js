var unirest = require('unirest');
var express = require('express');
var events = require('events');

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
               emitter.emit('end', response.body);
            });
    return emitter;
};

var getFromRelatedApi = function(id) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/artists/' + id + "/related-artists")
           .end(function(response) {
               emitter.emit('end', response.body);
            });
    return emitter;
};

var getFromTopTrackApi = function(id) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/artists/' + id + "/top-tracks")
           .end(function(response) {
               emitter.emit('end', response.body);
            });
    return emitter;
};

var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        var artist = item.artists.items[0];
        var related = getFromRelatedApi(artist.id);
        related.on('end', function(item) {
          var artists = item.artists;
          artists.forEach(function(art) {
            var top_tracks = getFromTopTrackApi(art.id);
            top_tracks.on('end', function(item) {
              var tracks = item.tracks;
              res.json(tracks);
            });
          });
          res.json(artists);
        });
    });

    searchReq.on('error', function() {
        res.sendStatus(404);
    });
});

app.listen(8080);