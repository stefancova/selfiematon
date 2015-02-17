// Variables
var socket = '';
var $wall = '';
var $progress = '';
var users = [];
var user = '';
var canvas = '';
var context = '';
var video = '';
var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

$(document).ready(function () {
    console.log('ready !');

    function hasGetUserMedia() {
        return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    }

    // Detect browser capacities
    if (hasGetUserMedia()) {
        console.log('getUserMedia OK');

        $('#capture-file').hide();
        captureVideo();

    } else {
        console.error('getUserMedia() is not supported in your browser');

        $('#capture-video').hide();
        // Detect old IE
        if (Detectizr.browser.name === 'ie' && Number(Detectizr.browser.version) < 10){
            $('.video-wrapper').html('Veuillez mettre à jour votre navigateur');
        }
    }

    initWebsockets();

    // Get Dom elements
    $wall = $("#wall");
    $progress = $("#progress");

    sendCapture();
});


/**
 * initWebsockets
 */
var initWebsockets = function () {

    // Define websocket
    socket = io.connect('http://pm-stecov.equesto.fr:80') //TODO: add settings for this;

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
 * cropCanvas
 * @param source (image or video)
 * @param width
 * @param height
 * @returns {string}
 */
var cropCanvas = function (source, width, height){
    console.log('cropCanvas',  width, height);

    // Set canvas size to a square
    var canvasSize = Math.min(width, height);
    var cropX = 0;
    var cropY = 0;
    // Define crop
    if (width > height) {
        cropX = width - height;
    } else {
        cropY = height - width;
    }
    console.log('canvasSize', canvasSize, 'cropX', cropX / 2, 'cropY', cropY / 2);


    // Set canvas canvasSize and draw source in canvas with cropping
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, -cropX, -cropY, canvasSize + cropX, canvasSize + cropY);

    return canvas;

};

/**
 * cropImage
 * @param base64
 */
var cropImage = function(base64){

    var image = new Image();
    image.src = base64;

    console.log('cropImage', image.width,image.height)

    var canvas = cropCanvas(image, image.width,image.height);
    return canvas;
};

/**
 * cropVideo
 * @param video
 */
var cropVideo = function (video) {
    console.log('cropVideo', video);

    var canvas = cropCanvas(video, video.videoWidth, video.videoHeight);
    return canvas;
};


/**
 * sendCapture : video streaming or input file
 */
var sendCapture = function () {

    var pseudo;

    function checkUser(){
        // Check user
        pseudo = $("#pseudo").val();
        if (isUserExist(pseudo)) {
            removeItemInArray(users, pseudo);
            $('#'+pseudo).remove();
        }
        console.log('submit', users, pseudo);
    }


    // VIDEO STREAMING
    $("#capture-video").on("click", function () {

        checkUser();

        // Show progress bar
        $progress.addClass("active");

        // Send canvas to server
        var croppedVideo = cropVideo(video);
        var dataURL = croppedVideo.toDataURL();
        socket.emit('newimage', {image: dataURL, pseudo: pseudo})

    });


    // CAPTURE FILE
    $('#capture-file').on('change', function (e) {
        checkUser();

        // Show progress bar
        $progress.addClass("active");

        loadImage(
            e.target.files[0],
            function (img) {
                console.log('img',img.toDataURL().substring(0,100));
                socket.emit('newimage', {image : img.toDataURL(), pseudo: pseudo});
            },
            // Options
            {
                canvas: true,
                maxWidth: 480,
                maxHeight: 480,
                crop: true,
                orientation : true
            }
        );
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