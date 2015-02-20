/**
 * Created by stecov on 29/01/2015.
 * Using express 3/4
 */
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var path = require('path');


// Make the files in the public folder available to the world
app.use(express.static(__dirname + '/public'));

// Route
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

// Websocket actions
io.on('connection', function (socket) {
    console.log('A client is connected !');

    // Read images on file dir and emit message "readfiles"
    fs.readdir( 'public/img/photo', function (err, files) {
        if (!err){
            console.log('read dir', files);
            socket.emit('readfiles',files);
        }
        else{
            throw err;
        }
    });

    // When server receive an image
    socket.on('newimage', function (data) {

        // Write image on server file dir
        var image = data.image.replace(/^data:image\/\w+;base64,/, "");

        console.log('on_newimage : ' , image.substring(0,100));

        var imageBuffer = new Buffer(image, 'base64');
        var fileName = './public/img/photo/'+ data.pseudo + '.png';

        fs.writeFile(fileName, imageBuffer, 'binary', function(err){
            if (err) {
                throw err
            }else{
                // Emit "filesaved"
                socket.broadcast.emit('filesaved', data.pseudo + '.png');
                socket.emit('filesaved', data.pseudo + '.png');
                console.log('File '+ data.pseudo + '.png saved.');
            }
        });

    });
});



// Run server
server.listen(80);