// Define websocket
var socket = io.connect('http://pm-stecov.equesto.fr:8080');

var wall = '';
var progress = '';
var user = '';
var users = [];
var photoTaken = false;


/**
 * Test if an user exist
 * @param user
 * @returns {boolean}
 */
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

/**
 * Insert image in DOM
 * @param imagePath {string}
 * @param method {string} appendChild or insertBefore
 */
var insertImage = function (imagePath, method) {
    console.log('insertImage', imagePath, method);

    // Push image to wall
    var user = imagePath.replace('.png', '');
    var li = document.createElement("li");
    var span = document.createElement("span");
    li.setAttribute('id', user);
    li.setAttribute('class', 'wall-user');

    var img = document.createElement("img");
    img.setAttribute("src", "./img/photo/" + imagePath + '?' + new Date().getTime());

    var p = document.createElement("p");
    p.innerHTML = user;

    li.appendChild(span);
    span.appendChild(img);
    span.appendChild(p);

    // Insert image
    method === 'appendChild' ? wall.appendChild(li) :  wall.insertBefore(li, wall.firstChild);

    // Add user to array users
    users.push(imagePath.replace('.png', ''));
};


// IO: Read images from server
socket.on('readfiles', function (imagesArray) {
    console.log('on_readfiles', imagesArray);

    for (var i = 0; i < imagesArray.length; i++) {
        insertImage(imagesArray[i], 'appendChild')
    }
});


// IO: Save a new file
socket.on('filesaved', function (image) {
    console.log('on_filesaved', image);
    insertImage(image,'insertBefore');
    progress.className = "";
});


// ############ CAPTURE CAMERA ###########/

// Put event listeners into place
window.addEventListener("DOMContentLoaded", function () {

    wall = document.getElementById("wall");
    progress = document.getElementById("progress");

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

        // Set canvas size
        var canvasSize = Math.min(video.videoWidth,video.videoHeight);
        var cropX = 0;
        var cropY = 0;
        // Define crop
        if(video.videoWidth > video.videoHeight){
            cropX = video.videoWidth - video.videoHeight;
        }else{
            cropY = video.videoHeight - video.videoWidth;
        }
        console.error('canvasSize',canvasSize,'cropX',cropX/2,'cropY',cropY/2)


        // Set canvas canvasSize and draw video in canvas with cropping
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, -cropX, -cropY, canvasSize+cropX, canvasSize+cropY);

    });

    // Send photo
    document.getElementById("form").addEventListener("submit", function (e) {

        e.preventDefault();
        var error = document.getElementById("error");

        progress.classList.add("active");

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
            error.innerHTML = 'All good !';
            socket.emit('newimage', {image: dataURL, pseudo: pseudo})
        }
    });

}, false);
