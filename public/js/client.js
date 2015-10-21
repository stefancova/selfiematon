// Variables
var socket = '';
var $wall = '';
var $progress = '';
var $pseudoError = '';
var $canvas = '';
var users = [];
var user = '';
var context = '';
var video = '';
var pseudo = '';
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

document.addEventListener('DOMContentLoaded', function() {
    console.log('ready !');

    function hasGetUserMedia() {
        return !!(navigator.getUserMedia);
    }

    function hasFileReader() {
        return !!(window.FileReader);
    }

    // Detect browser capacities
    if (hasGetUserMedia() ) {
        console.log('getUserMedia OK');
        document.querySelector('.wrapper-video').classList.add('active');
        captureVideo();
    } else {
        console.error('getUserMedia() is not supported in your browser');
        document.querySelector('.wrapper-file').classList.add('active');
        // Detect old IE and old browsers
        if (!hasFileReader()) {
            document.querySelector('#form').innerHTML = 'Veuillez mettre à jour votre navigateur';
        }
    }

    initWebsockets();

    // Get Dom elements
    $wall = document.querySelector('#wall');
    $progress = document.querySelector('#progress');
    $pseudoError = document.querySelector('#pseudo-error');
    $canvas = document.querySelector('#preview');
    context = $canvas.getContext('2d');

    sendCapture();
});


/**
 * initWebsockets
 */
var initWebsockets = function () {

    localStorage.debug = '*';

    // Define websocket
    socket = io.connect(window.location.origin);

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
        $progress.classList.remove('active');
    });
};


/**
 * captureVideo
 */
var captureVideo = function () {

    video = document.querySelector('video');

    errorCallback = function (error) {
        console.log('Video capture error: ', error.code);
    };

    if (navigator.getUserMedia) {
        navigator.getUserMedia({audio: false, video: true},
            function (stream) {
                video.src = window.URL.createObjectURL(stream);
            },
            errorCallback);
    }

};



/**
 * cropSourceTocanvas
 * @param source (image or video)
 * @param width
 * @param height
 * @returns {string}
 */
var cropSourceTocanvas = function (source, width, height) {
    console.log('cropSourceTocanvas', width, height);

    // Set source size to a square
    var sourceSize = Math.min(width, height);
    var cropX = 0;
    var cropY = 0;
    // Define crop
    if (width > height) {
        cropX = width - height;
    } else {
        cropY = height - width;
    }
    console.log('$canvasSize', sourceSize, 'cropX', cropX / 2, 'cropY', cropY / 2);


    // Set $canvas size and draw source in $canvas with cropping
    $canvas.width = sourceSize;
    $canvas.height = sourceSize;
    context.clearRect(0, 0, $canvas.width, $canvas.height);
    context.drawImage(source, -cropX, -cropY, sourceSize + cropX, sourceSize + cropY);

    return $canvas;

};

/**
 * cropImage
 * @param base64
 */
var cropImage = function (base64) {

    var image = new Image();
    image.src = base64;

    console.log('cropImage', image.width, image.height);

    var canvas = cropSourceTocanvas(image, image.width, image.height);
    return canvas;
};

/**
 * cropVideo
 * @param video
 */
var cropVideo = function (video) {
    console.log('cropVideo', video);

    var canvas = cropSourceTocanvas(video, video.videoWidth, video.videoHeight);
    return canvas;
};


/**
 * isPseudoFilled
 * @returns {boolean}
 */
var isPseudoFilled = function () {
    console.log('isPseudoFilled');

    pseudo = document.querySelector('#pseudo').value;

    if (pseudo === '') {
        return false;
    } else {
        if (isUserExist(pseudo)) {
            removeItemInArray(users, pseudo);
            document.querySelector('#' + pseudo).remove();
        }
        return true;
    }
};

/**
 * sendCapture : video streaming or input file
 */
var sendCapture = function () {


    // VIDEO STREAMING
    document.querySelector('#capture-video').addEventListener('click', function () {

        $pseudoError.classList.remove('active');

        if (isPseudoFilled()) {
            // Show progress bar
            $progress.classList.remove('active');

            // Send $canvas to server
            var croppedVideo = cropVideo(video);
            var dataURL = croppedVideo.toDataURL();
            socket.emit('newimage', {image: dataURL, pseudo: pseudo})
        } else {
            $pseudoError.classList.add('active');
        }

    });


    // CAPTURE FILE
    document.querySelector('#capture-file').addEventListener('change', function (e) {

        $pseudoError.classList.remove('active');

        if (isPseudoFilled()) {
            // Show progress bar
            $progress.classList.add('active');

            loadImage(
                e.target.files[0],
                function (img) {
                    console.log('img', img.toDataURL().substring(0, 100));
                    socket.emit('newimage', {image: img.toDataURL(), pseudo: pseudo});
                },
                // Options
                {
                    $canvas: true,
                    maxWidth: 480,
                    maxHeight: 480,
                    crop: true,
                    orientation: true
                }
            );
        } else {
            $pseudoError.classList.add('active');
        }
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
    var li = document.createElement('li');
    var span = document.createElement('span');
    li.setAttribute('id', user);
    li.setAttribute('class', 'wall-user');

    var img = document.createElement('img');
    img.setAttribute('src', './img/photo/' + imagePath + '?' + new Date().getTime());

    var p = document.createElement('p');
    p.innerHTML = user;

    li.appendChild(span);
    span.appendChild(img);
    span.appendChild(p);

    // Insert image (after or before)
     method === 'after' ? $wall.appendChild(li) : $wall.insertBefore(li, $wall.firstChild);

    // Add user to array users
    users.push(user);
};