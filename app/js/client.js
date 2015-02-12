// Define websocket
var socket = io.connect('http://pm-stecov.equesto.fr:8080');

var wall = '';
var user = '';
var users = [];
var photoTaken = false;


var isUserExist = function (user) {
    for (var i = 0; i < users.length; i++) {
        if (users.indexOf(user) > -1) {
            console.log('EXISTE');
            return true;
        } else {
            console.log('EXISTE PAS');
            return false;
        }
    }
};

var insertImage = function (imagePath) {
    console.log('insertImage', imagePath);

    // Push image to wall
    var user = imagePath.replace('.png', '');
    var div = document.createElement("div");
    div.setAttribute('id', user);
    div.setAttribute('class', 'wall-user');

    var img = document.createElement("img");
    img.setAttribute("src", "./img/photo/" + imagePath + '?' + new Date().getTime());

    var p = document.createElement("p");
    p.innerHTML = user;

    div.appendChild(img);
    div.appendChild(p);
    wall.appendChild(div);
    // Ads an user
    users.push(imagePath.replace('.png', ''));
};


// IO: Read images from server
socket.on('readfiles', function (imagesArray) {
    console.log('on_readfiles', imagesArray);

    for (var i = 0; i < imagesArray.length; i++) {
        insertImage(imagesArray[i])
    }
});


// IO: Save a new file
socket.on('filesaved', function (image) {
    console.log('on_filesaved', image)
    insertImage(image);
});


// ############ CAPTURE CAMERA ###########/

// Put event listeners into place
window.addEventListener("DOMContentLoaded", function () {

    wall = document.getElementById("wall");

    // Grab elements, create settings, etc.
    var canvas = document.getElementById("preview"),
        context = canvas.getContext("2d"),
        video = document.getElementById("video"),
        videoObj = {
            "video": true,
            "videoWidth": 200,
            "videoHeight": 200

        },
        errBack = function (error) {
            console.log("Video capture error: ", error.code);
        };

    // Put video listeners into place
    if (navigator.getUserMedia) { // Standard
        navigator.getUserMedia(videoObj, function (stream) {
            video.src = stream;
            video.play();
        }, errBack);
    } else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
        navigator.webkitGetUserMedia(videoObj, function (stream) {
            video.src = window.webkitURL.createObjectURL(stream);
            video.play();
        }, errBack);
    }
    else if (navigator.mozGetUserMedia) { // Firefox-prefixed
        navigator.mozGetUserMedia(videoObj, function (stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();
        }, errBack);
    }

    // Trigger photo take
    document.getElementById("snap").addEventListener("click", function () {
        photoTaken = true;

        // Hide preview and show canvas
        document.getElementById("preview-image").style.display = 'none';
        canvas.style.display = 'block';

        // Set canvas size and draw video in canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    });

    // Send photo
    document.getElementById("form").addEventListener("submit", function (e) {

        e.preventDefault();
        var error = document.getElementById("error");

        // Send canvas to server
        var dataURL = canvas.toDataURL();
        var pseudo = document.getElementById("pseudo").value;

        console.log('submit', users, photoTaken, pseudo);

        if (photoTaken === false) {
            error.innerHTML = 'Prendre une photo !';
        }
        else {
            if (isUserExist(pseudo)) {
                document.getElementById(pseudo).remove();
            }
            error.innerHTML = 'OK';
            socket.emit('newimage', {image: dataURL, pseudo: pseudo})
        }
    });

}, false);
