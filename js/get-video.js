var videoObj = {};
var videoInfo = {};
var videoList = [];
var tvState = 0;
var muteState = 0;
var actionState = 0;
var tvAudioLevel = 50;
var currentVideo;
var currentVideoID;
var player;
var bgv;
var delay;
var autoChannelDelay;
var channelDelayState = 0;

//Fisher-Yates shuffle from Mike Bostock's blog
function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function triggerAnimation(callback) {
    var actionDelay;
    if (!actionState) {
        actionState = 1;
        setTimeout(function () {
            actionState = 0;
        }, 1000)
        bgv.play();
        delay = (bgv.duration * 1000) - 800;
        clearTimeout(actionDelay);
        actionDelay = setTimeout(function () {
            callback();
        }, delay);
    }
}

function turnOnOffTV() {
    if (!tvState) {
        tvState = 1;
        actionState = 1;

        currentVideo = videoList[0];
        currentVideoID = 0;

        player = new YT.Player('yt-iframe', {
            width: 1280,
            height: 720,
            videoId: currentVideo,
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'showinfo': 0,
                'rel': 0,
                'iv_load_policy': 3,
                
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
        actionState = 0;
    } else {
        
    }
}

function onPlayerError(){
    triggerAnimation(nextChannel);
}

function onPlayerReady(event) {
    event.target.setVolume(tvAudioLevel);
    console.log("Player Ready!");
}

function onPlayerStateChange(event) {
    if (event.data == 1 && !channelDelayState) {
        clearTimeout(autoChannelDelay);
        var acdMS = player.getDuration() * 1000 - delay - 300;
        autoChannelDelay = setTimeout(function () {
            triggerAnimation(nextChannel);
        }, acdMS);
        console.log("Timeout Set on state change!")
        channelDelayState = 1;
    }
    event.target.setVolume(tvAudioLevel);
}

function nextChannel() {
    if (tvState && !actionState) {
        console.log("Timeout Removed on channel change!")
        actionState = 1;
        currentVideoID++;
        currentVideo = videoList[currentVideoID];
        player.loadVideoById(currentVideo);
        if (currentVideoID == videoList.length) {
            videoObj;
            videoInfo = {};
            videoList = [];
            getVideos();
            currentVideoID = 0;
            console.log("Video list refreshed!");
        }
        console.log("Channel Changed!");
        actionState = 0;
        channelDelayState = 0;
    }
}

function volumeUp(direction) {
    if (tvState && !actionState) {
        actionState = 1;
        if (tvAudioLevel !== 100) {
            tvAudioLevel += 10;
        }
        player.setVolume(tvAudioLevel);
        console.log("Volume Raised!");
        actionState = 0;
    }
}

function volumeDown() {
    if (tvState && !actionState) {
        actionState = 1;
        if (tvAudioLevel !== 0) {
            tvAudioLevel -= 10;
        }
        player.setVolume(tvAudioLevel);
        console.log("Volume Lowered!");
        actionState = 0;
    }
}

function mute() {
    if (tvState && !actionState) {
        if (!muteState) {

        }
    }
}

function sortVideoData() {
    //    var tcode = new RegExp(/(?:(?:http|https):\/\/(?:youtu\.be|youtube\.com|.*\.youtube\.com)\/)(?:.*?)(\?t|&t)/);
    var tcode = new RegExp(/((?:\?|;|&)t=)/);
    //    var videoIdReg = new RegExp(/(?:(?:http|https):\/\/(?:youtu\.be|youtube\.com|.*\.youtube\.com)\/)(?:watch\?v=(.*?)&|watch\?v=(.*)|(.*)\?|(.*))/);
    var videoIdReg = new RegExp(/(?:(?:http|https):\/\/(?:youtu\.be|youtube\.com|.*\.youtube\.com)\/)(?:watch\?(?:.*?)v=(.*?)&|watch\?(?:.*?)v=(.*)|watch\?v=(.*?)&|watch\?v=(.*)|(.*)\?|(.*))/);
    for (var i = 0; i < videoObj.data.children.length; i++) {
        var submittedUrl = videoObj.data.children[i].data.url;
        if (tcode.test(submittedUrl)) {
            continue;
        } else {
            var capturedUrl = videoIdReg.exec(submittedUrl);
            var capturedId;
            for (var ii = 1; ii < capturedUrl.length; ii++) {
                if (typeof capturedUrl[ii] !== "undefined") {
                    capturedId = capturedUrl[ii];
                    break;
                }
            }
            videoList.push(capturedId);
            videoInfo[capturedId] = {
                title: videoObj.data.children[i].data.media.oembed.title,
                description: videoObj.data.children[i].data.media.oembed.description
            };
        }
    }
    videoList = shuffle(videoList);
}

function getVideos() {
    var timeOptions = ["week", "month", "year", "all"];
    var sortOptions = ["relevance", "hot", "top", "new", "comments"];
    var redditURL = "https://www.reddit.com/r/InterdimensionalCable/search.json?q=site%3Ayoutube.com+OR+site%3Ayoutu.be+AND+self%3Ano&restrict_sr=on&sort=" + sortOptions[Math.floor(Math.random() * sortOptions.length)] + "&t=" + timeOptions[Math.floor(Math.random() * timeOptions.length)] + "&limit=50";
    var jqxhr = $.ajax({
            url: redditURL
        })
        .done(function (data) {
            videoObj = data;
            sortVideoData();
        });
}

function onPlayerReady(event) {
    event.target.setVolume(100);
    event.target.playVideo();
}

$(function () {
    bgv = document.getElementById("rick-bg");
    getVideos();
})
