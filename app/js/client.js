// Define websocket
var socket = io.connect('http://pm-stecov.equesto.fr:8080');

var $wall = '';
var $progress = '';
var users = [];
var user = '';


/**
 * Test if an user exist
 * @param user
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
var removeInArray = function (arr, item) {
    for (var i = arr.length; i--;) {
        if (arr[i] === item) {
            arr.splice(i, 1);
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


// IO: Read images from server
socket.on('readfiles', function (imagesArray) {
    console.log('on_readfiles', imagesArray);

    for (var i = 0; i < imagesArray.length; i++) {
        insertImage(imagesArray[i], 'after')
    }
});


// IO: Save a new file
socket.on('filesaved', function (image) {
    console.log('on_filesaved', image);

    insertImage(image, 'before');
    $progress.removeClass('active');
});


// ############ CAPTURE CAMERA ###########/

// On dom ready
$(document).ready(function () {
    console.log("ready!");

    $wall = $("#wall");
    $progress = $("#progress");

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


    // Send photo
    $("#form").on("submit", function (e) {

        e.preventDefault();

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

        // Show progress bar
        $progress.addClass("active");

        // Send canvas to server
        var dataURL = canvas.toDataURL();
        var pseudo = $("#pseudo").val();

        console.log('submit', users, pseudo);

        if (isUserExist(pseudo)) {
            removeInArray(users, pseudo);
            $(pseudo).remove();
        }

        socket.emit('newimage', {image: dataURL, pseudo: pseudo})

    });

});
