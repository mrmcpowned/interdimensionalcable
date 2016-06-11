var videoObj = {};
var videoInfo = {};
var videoList = [];
var redditHash;
var channelNames = ["1", "2", "TWO", "3", "4", "42", "1337", "5", "6", "117", "7", "A113", "8", "9", "10", "🐐", "101", "C137", "👌😂", "🍌", "🍆", "20", "30", "40", "50", "60", "69", "70", "80", "90", "100", "C132", "35C", "J19ζ7"];
var audioQuotes = ["sexsells", "improv", "relax", "billmurray"];
var tvState = 0;
//Since I'm depending on reddit's api for getting curated videos, I have to prepare for occasion where reddit would be down 
var loginState = 0;
var muteState = 0;
var menuState = 0;
var duckState = 0;
var animationState = 0;
var tvAudioLevel = 50;
var channelDelayState = 0;
var player;
var bgv;
var bga;
var cha;
var qa;
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
        }, animationDelay + 300);
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
        $('body').toggleClass('tv-on');
        $('body').removeClass('tv-off');
            player = new YT.Player('yt-iframe', {
                width: 1280,
                height: 720,
                videoId: get_video()[0],
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
        cha.play();
        if (muteState) {
            $('.container').addClass('mute');
        }
        changeChannelName();

    } else if (tvState) {
        clearTimeout(autoChannelDelay);
        getVideos();
        $('body').toggleClass('tv-on');
        $('body').addClass('tv-off');
        if (menuState) {
            console.log('tv menu reset');
            menuToggle();
        }
            player.destroy();
        bga.play();
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
    console.error('Error Loading Video, Changing channel in 2 seconds');
    autoChannelDelay = setTimeout(function () {
        triggerAnimation(nextChannel);
    }, 2000);
}

function onPlayerReady(event) {
    if (muteState) {
        player.mute();
    }
    $('#yt-contain').addClass("reset");
    setTimeout(function () {
        $('#yt-contain').removeClass("reset");
    }, 200);
    event.target.setVolume(tvAudioLevel);
    console.log("Player Ready!");
}

function onPlayerStateChange(event) {
    if (event.data === 1 && !channelDelayState) {
        clearTimeout(autoChannelDelay);
        var acdMS = player.getDuration() * 1000 - delay - 300;
        autoChannelDelay = setTimeout(function () {
            console.log("Channel auto-changed!");
            triggerAnimation(nextChannel);
        }, acdMS);
        console.log("Timeout Set on state change!");
        channelDelayState = 1;
    }
    if (event.data === 2) {
        event.target.playVideo();
    }
    if (event.data === 0) {
        nextChannel();
    }
    //    event.target.setVolume(tvAudioLevel);
}

function nextChannel() {
    if (tvState) {
        if (Math.random() <= 0.1) {
            setTimeout(playQuote(), 200);
        }
        clearTimeout(autoChannelDelay);
        console.log("Timeout Removed on channel change!");
        player.loadVideoById(get_video()[0]);
        cha.play();
        console.log("Channel Changed!");
        changeChannelName();
        $('#yt-contain').addClass("reset");
        setTimeout(function () {
            $('#yt-contain').removeClass("reset");
        }, 200);
        channelDelayState = 0;
    }
}

function volumeUp(direction) {
    if (tvState && !duckState) {
        if (tvAudioLevel !== 100) {
            tvAudioLevel += 10;
            $('.volume').addClass("reset");
            setTimeout(function () {
                $('.volume').removeClass("reset");
            }, 200);
            $('.volume').attr('data-volume', tvAudioLevel);
        }
        if (muteState) {
            console.log('Un Muted Audio on Volume Raise!');
            mute();
        }
        player.setVolume(tvAudioLevel);
        console.log("Volume Raised!");
    }
}

function volumeDown() {
    if (tvState && !duckState) {
        if (tvAudioLevel === 10) {
            tvAudioLevel -= 10;
            mute();
        } else if (tvAudioLevel > 10) {
            tvAudioLevel -= 10;
            $('.volume').addClass("reset");
            setTimeout(function () {
                $('.volume').removeClass("reset");
            }, 200);
            $('.volume').attr('data-volume', tvAudioLevel);
            player.setVolume(tvAudioLevel);
            console.log("Volume Lowered!");
        }
    }
}

function mute() {
    if (tvState) {
        if (!muteState) {
            player.mute();
            $('.container').addClass('mute');
            muteState = 1;
        } else {
            player.unMute();
            $('.container').removeClass('mute');
            $('.volume').addClass("reset");
            setTimeout(function () {
                $('.volume').removeClass("reset");
            }, 200);
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

function audioDuck(direction, value, eventData) {
    //    console.log("Current volume level: " + player.getVolume());
    if (eventData !== "") {
        //        console.log("Removing ended event");
        eventData.target.removeEventListener(eventData.type, function () {});
    }
    var playerVolume = player.getVolume();
    //A direction Value of 1 ducks, whereas a value of 0 reverts
    if (direction) {
        //        console.log("Ducking volume");
        player.setVolume(player.getVolume() * value);
    } else {
        //        console.log("Reverting volume");
        player.setVolume(player.getVolume() / value);
    }
    //    console.log("Current volume level after Ducking/Reverting: " + player.getVolume());
}

function playQuote() {
    if (!duckState) {
        duckState = 1;
        var duckFloat = 0.1;
        console.log("Starting quote playing");
        qa.src = "audio/quotes/" + audioQuotes[Math.floor(Math.random() * audioQuotes.length)] + ".mp3";
        audioDuck(1, duckFloat, "");
        qa.play();
        qa.addEventListener("ended", function (e) {
            //            console.log("Quote playback ended");
            audioDuck(0, duckFloat, e);
            duckState = 0;
        });
    }
}


if (!Array.prototype.randomElement) {
    Array.prototype.randomElement = function () {
        return this[Math.floor(Math.random() * this.length)]
    };
}

if (!Array.prototype.randomPop) {
    Array.prototype.randomPop = function () {
        var index = Math.floor(Math.random() * this.length);
        return this.splice(index, 1);
    };
}

var get_video = (function () {

    var played = [];
    var videos = [];

    var youtube_video_regex = new RegExp(/^.*(youtu.be\/|v\/|embed\/|watch\?|youtube.com\/user\/[^#]*#([^\/]*?\/)*)\??v?=?([^#\&\?]*).*/);

    var get_api_call = function (time, sort) {
        return `https://www.reddit.com/r/InterdimensionalCable/search.json?q=site%3Ayoutube.com&restrict_sr=on&sort=${sort}&t=${time}&limit=50`;
    };

    var add_youtube_url = function (youtube_video_url) {
        // Check if the URL is for youtube
        if (!youtube_video_regex.test(youtube_video_url)) {
            return false;
        }
        // Check to see if the entier video is being linked.
        // If a certain index is being linked, ignore the video.
        if (youtube_video_url.indexOf("&t=") != -1) {
            return false;
        }
        var groups = youtube_video_regex.exec(youtube_video_url);
        // TODO: Trim video id?
        var video_id = groups[3]; // 3rd group is the video id.
        if (played.indexOf(video_id) != -1 || videos.indexOf(video_id) != -1) {
            return false;
        }
        videos.push(video_id);
        return true;
    };

    var load_more = function () {
        var time = ["week", "month", "year", "all"].randomElement();
        var sort = ["relevance", "hot", "top", "new", "comments"].randomElement();
        var url = get_api_call(time, sort);
        $.getJSON(url, function (data) {
            data.data.children.forEach(function (child) {
                if (add_youtube_url(child.data.url)) {
                    console.log("Added " + child.data.url);
                } else {
                    console.log("Ignored " + child.data.url);
                }
            });
        });
    };

    load_more();

    return function () {
        if (videos.length < 5) {
            if (videos.length == 0) {
                return null;
            }
            load_more();
        }
        var item = videos.randomPop();
        played.push(item);
        return item;
    };
})();

$(function () {
    bgv = document.getElementById("rick-bg");
    bga = document.getElementById("off-audio");
    cha = document.getElementById("switch-audio");
    qa = document.getElementById("quote-player");

});
