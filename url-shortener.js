var express = require('express')
var validUrl = require('valid-url')
var mongo = require('./node_modules/mongoose/node_modules/mongodb').MongoClient
var app = express()
var json = {}
var urlDb = 'mongodb://localhost:27017/urlmap'

app.get('/:id', function(req, res) {
    var id = req.params.id

    mongo.connect(urlDb, function(err, db) {
        if (err) throw err
        var collection = db.collection('urls')
        collection.find({
            short_url: 'https://url-shortener-ms-sfsd.c9users.io/' + id
        }).toArray(function(err, docs) {
            if (err) throw err

            if (docs.length != 0) {
                res.redirect(docs[0]['original_url'])
                db.close()
            } else {
                res.send('no entry found')
                db.close()
            }
        })
    })
})

app.get('/new/*', function(req, res) {
    var url = req.params[0]

    if (validUrl.isWebUri(url)) {
        mongo.connect(urlDb, function(err, db) {
            if (err) throw err
            var collection = db.collection('urls')
            collection.find({
                original_url: url
            }).toArray(function(err, docs) {
                if (err) throw err

                if (docs.length == 0) {
                    collection.count({}, function(error, count) {
                        if (err) throw err
                        var nextFreeCounter = count + 1
                        var urlEntry = {
                            original_url: url,
                            short_url: 'https://url-shortener-ms-sfsd.c9users.io/' + nextFreeCounter
                        }

                        collection.insert(urlEntry, function(err, data) {
                            if (err) throw err
                            json = {
                        original_url: urlEntry['original_url'],
                        short_url: urlEntry['short_url']
                    }
                            res.send(json)
                            db.close()
                        })
                    });
                }
                else {
                    json = {
                        original_url: docs[0]['original_url'],
                        short_url: docs[0]['short_url']
                    }
                    res.send(json)
                    db.close()
                }
            })
        })

    }
    else {
        json = {
            error: url + ' is not a valid RFC 3986 URI'
        }
        res.send(json)
    }
})

app.listen(process.env.PORT)