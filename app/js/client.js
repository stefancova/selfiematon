// Variables
var socket = '';
var $wall = '';
var $progress = '';
var users = [];
var user = '';
var canvas = '';
var context = '';
var video = '';


$(document).ready(function () {

    initWebsockets();

    // Get Dom elements
    $wall = $("#wall");
    $progress = $("#progress");

    captureVideo();
    sendPhoto();
});


/**
 * initWebsockets
 */
var initWebsockets = function () {

    // Define websocket
    socket = io.connect('http://pm-stecov.equesto.fr:8080') //TODO: add settings for this;

    // IO : Read images from server
    socket.on('readfiles', function (imagesArray) {
        console.log('on_readfiles', imagesArray);

        for (var i = 0; i < imagesArray.length; i++) {
            insertImage(imagesArray[i], 'after')
        }
    });

    // IO : Save a new file
    socket.on('filesaved', function (image) {
        console.log('on_filesaved', image);

        insertImage(image, 'before');
        $progress.removeClass('active');
    });
};


/**
 * captureVideo
 */
var captureVideo = function () {

    // Grab elements, create settings, etc.
    canvas = document.getElementById("preview");
    context = canvas.getContext("2d");
    video = document.getElementById("video");
    var videoObj = {
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
};

/**
 * cropVideo
 * Crop video do a square depending of the orientation of the camera
 */
var cropVideo = function () {

    // Set canvas size to a square
    var canvasSize = Math.min(video.videoWidth, video.videoHeight);
    var cropX = 0;
    var cropY = 0;
    // Define crop
    if (video.videoWidth > video.videoHeight) {
        cropX = video.videoWidth - video.videoHeight;
    } else {
        cropY = video.videoHeight - video.videoWidth;
    }
    console.log('canvasSize', canvasSize, 'cropX', cropX / 2, 'cropY', cropY / 2);


    // Set canvas canvasSize and draw video in canvas with cropping
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, -cropX, -cropY, canvasSize + cropX, canvasSize + cropY);

};


/**
 * sendPhoto
 */
var sendPhoto = function () {

    $("#form").on("submit", function (e) {

        e.preventDefault();

        // Show progress bar
        $progress.addClass("active");

        cropVideo();

        // Check user
        var pseudo = $("#pseudo").val();
        if (isUserExist(pseudo)) {
            removeItemInArray(users, pseudo);
            $('#'+pseudo).remove();
        }
        console.log('submit', users, pseudo);

        // Send canvas to server
        var dataURL = canvas.toDataURL();
        socket.emit('newimage', {image: dataURL, pseudo: pseudo})

    });
};


/**
 * Test if an user exist
 * @param user {string}
 * @returns {boolean}
 */
var isUserExist = function (user) {
    for (var i = 0; i < users.length; i++) {
        if (users.indexOf(user) > -1) {
            console.log(user + ' exist');
            return true;
        } else {
            console.log(user + ' dont exist');
            return false;
        }
    }
};


/**
 * Remove an item from an array
 * @param arr
 * @param item
 */
var removeItemInArray = function (arr, item) {
    for (var i = arr.length; i--;) {
        if (arr[i] === item) {
            arr.splice(i, 1);
        }
    }
};


/**
 * Insert image in DOM
 * @param imagePath {string}
 * @param method {string} : insert after or before
 */
var insertImage = function (imagePath, method) {
    console.log('insertImage', imagePath, method);

    // Push image to $wall
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
    method === 'after' ? $wall.append(li) : $wall.prepend(li);

    // Add user to array users
    users.push(imagePath.replace('.png', ''));
};