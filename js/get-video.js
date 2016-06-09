var videoObj = {};
var videoInfo = {};
var videoList = [];
var redditData = {};
var channelNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "101", "C137", "666", "👌😂", "🍌", "🍆", "20", "30", "40", "50", "60", "69", "70", "80", "90", "100", "C132", "35C", "J19ζ7"];
var tvState = 0;
var muteState = 0;
var menuState = 0;
var animationState = 0;
var tvAudioLevel = 50;
var channelDelayState = 0;
var currentVideo;
var currentVideoID;
var player;
var bgv;
var delay;
var autoChannelDelay;

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
    var animationDelay = bgv.duration * 1000;
    if (!animationState) {
        animationState = 1;
        setTimeout(function () {
            animationState = 0;
        }, animationDelay);
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
        videoList = shuffle(videoList);
        currentVideo = videoList[0];
        currentVideoID = 0;
        $('.container').toggleClass('tv-on');
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
                'disablekb': 1
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
        if (muteState) {
            player.mute();
        }
        changeChannelName();
        $('#yt-contain').addClass("reset")
        setTimeout(function () {
            $('#yt-contain').removeClass("reset");
        }, 200);

    } else if (tvState) {
        clearTimeout(autoChannelDelay);
        $('.container').toggleClass('tv-on');
        if (menuState) {
            console.log('tv menu reset');
            menuToggle();
        }
        player.destroy();
        channelDelayState = 0;
        tvState = 0;
    }
}


//Decided against doing this to keep the gag as genuine as possible. The beauty lies in nto knowing what's going on until it's too late
//function populateVideoInfo() {
//    $('.info-bar .responsive').css({"background-image": "url(http://img.youtube.com/vi/" + player.getVideoData().video_id + "/1.jpg)"});
//    $('.description p').text(player.getVideoData().title);
//}

function onPlayerError() {
    console.error('Error Loading Video, Changing channel in 2 seconds')
    setTimeout(function () {
        triggerAnimation(nextChannel);
    }, 2000);
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
            console.log("Channel auto-changed!");
            triggerAnimation(nextChannel);
        }, acdMS);
        console.log("Timeout Set on state change!");
        channelDelayState = 1;
    }
    if (event.data == 2) {
        event.target.playVideo();
    }
    if (event.data == 0) {
        nextChannel();
    }
    event.target.setVolume(tvAudioLevel);
}

function nextChannel() {
    if (tvState) {
        clearTimeout(autoChannelDelay);
        console.log("Timeout Removed on channel change!");
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
        changeChannelName();
        $('#yt-contain').addClass("reset")
        setTimeout(function () {
            $('#yt-contain').removeClass("reset");
        }, 200);
        channelDelayState = 0;
    }
}

function volumeUp(direction) {
    if (tvState) {
        if (tvAudioLevel !== 100) {
            tvAudioLevel += 10;
        }
        if (muteState) {
            console.log('Un Muted Audio on Volume Raise!')
            mute();
        }
        player.setVolume(tvAudioLevel);
        console.log("Volume Raised!");
    }
}

function volumeDown() {
    if (tvState) {
        if (tvAudioLevel !== 0) {
            tvAudioLevel -= 10;
        } else if (tvAudioLevel === 0) {
            mute();
        }
        player.setVolume(tvAudioLevel);
        console.log("Volume Lowered!");
    }
}

function mute() {
    if (tvState) {
        if (!muteState) {
            player.mute();
            muteState = 1;
        } else {
            player.unMute();
            muteState = 0;
        }
    }
}

function zoomToggle() {
    $('.container').toggleClass('zoom');
}

function menuToggle() {
    if (tvState) {
        if (!menuState) {
            menuState = 1;
        } else {
            menuState = 0;
        }
        $('.container').toggleClass('menu-overlay');
    }
}

function openVideo() {
    if (tvState) {
        window.open(player.getVideoUrl(), '_blank');
    }
}

function changeChannelName() {
    var channelName = channelNames[Math.floor(Math.random() * channelNames.length)];
    $("[data-channel-id]").attr("data-channel-id", channelName);
}

function sortVideoData() {
    //    var tcode = new RegExp(/(?:(?:http|https):\/\/(?:youtu\.be|youtube\.com|.*\.youtube\.com)\/)(?:.*?)(\?t|&t)/);
    var tcode = new RegExp(/((?:\?|;|&)t=)/);
    //    var videoIdReg = new RegExp(/(?:(?:http|https):\/\/(?:youtu\.be|youtube\.com|.*\.youtube\.com)\/)(?:watch\?v=(.*?)&|watch\?v=(.*)|(.*)\?|(.*))/);
    /**
    Ok, so like, my RegEx sucks. Here I've basically tried to gather the video ID properly from all these URLs.
    With the regex ontop, I'm finding URLs wit ha timestamp so I can later ignore then in the loop below. I know this can most likely be done with RegEx itself, but since I'm looping through
    */
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

$(function () {
    bgv = document.getElementById("rick-bg");
    getVideos();
    $.ajax({
        url: "https://www.reddit.com/api/me.json"
    }).done(function (data) {
        redditData = data;
    });
});
