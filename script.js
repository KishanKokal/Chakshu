const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');

// Check for webcam access support
function getUserMediaSupported() {
    return !!(navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia);
}

// add event listener to the button
if (getUserMediaSupported()) {
    enableWebcamButton.addEventListener('click', enableCam);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}

// Enable the live webcam view and start classification.
function enableCam(event) {
    // Only continue if the COCO-SSD has finished loading.
    if (!model) {
        return;
    }

    // Hide the button once clicked.
    event.target.classList.add('removed');

    // getUsermedia parameters to force video but not audio.
    const constraints = {
        video: {frameRate: {ideal: 60, max: 120}}
    };

    // Activate the webcam stream
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
    });
}

// Pretend model has loaded so we can try out the webcam code.
var model = true;
demosSection.classList.remove('invisible');

// Store the resulting model in the global scope of our app.
var model = undefined;

// wait for COCO-SSD to load
cocoSsd.load().then(function(loadedModel) {
    model = loadedModel;
    // Show demo section now model is ready to use.
    demosSection.classList.remove('invisible');
});

var children = [];
var new_object = "";
var msg = new SpeechSynthesisUtterance();
var message = new SpeechSynthesisUtterance();
msg.rate = 0.8;
message.rate = 0.9;

function predictWebcam() {
    // start classifying frame in the stream
    model.detect(video).then(function(predictions) {
        // remove highlighting from the previous frame
        for (let i = 0; i < children.length; i++) {
            liveView.removeChild(children[i]);
        }
        children.splice(0);

        // loop through the predictions and draw bounding boxes in the stream
        for (let n = 0; n < predictions.length; n++) {
            
            // draw box if and only if the prediction confidence > 66%
            if (predictions[n].score > 0.66) {
                msg.text = predictions[n].class;

                const p = document.createElement('p');
                p.innerText = predictions[n].class + ' - with ' +
                    Math.round(parseFloat(predictions[n].score) * 100) +
                    '% confidence.';
                p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: ' +
                    (predictions[n].bbox[1] - 10) + 'px; width: ' +
                    (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';

                const highlighter = document.createElement('div');
                highlighter.setAttribute('class', 'highlighter');
                highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: ' +
                    predictions[n].bbox[1] + 'px; width: ' +
                    predictions[n].bbox[2] + 'px; height: ' +
                    predictions[n].bbox[3] + 'px;';

                liveView.appendChild(highlighter);
                liveView.appendChild(p);
                children.push(highlighter);
                children.push(p);

                if (new_object !== msg.text) {
                    console.log("msg: " + msg.text);
                    message.text = "There's a " + msg.text + " ahead.";
                    window.speechSynthesis.speak(message);
                    new_object = msg.text;
                    break;
                }
            }
        }

        // keep predicting
        //window.requestAnimationFrame(predictWebcam);
        setTimeout(predictWebcam, 1500);
    });
}