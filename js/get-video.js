var isTVOn = false;
var isTVMuted = false;
var isMenuOpen = false;
var isAudioDucked = false;
var isAnimationPlaying = false;
var tvAudioLevel = 50;
var isNextSet = false;
var isRedditDown = true;
var player;
var bgv;
var bga;
var cha;
var qa;
var delay;
var autoChannelDelay;

function triggerAnimation(callback, param = "") {
    var actionDelay;
    var animationDelay = bgv.duration * 1000;
    if (!isAnimationPlaying) {
        isAnimationPlaying = !isAnimationPlaying;
        setTimeout(function () {
            isAnimationPlaying = !isAnimationPlaying;
        }, animationDelay + 300);
        bgv.play();
        delay = (bgv.duration * 1000) - 800;
        clearTimeout(actionDelay);
        actionDelay = setTimeout(function () {
            if (param != "") {
                callback(param);
            } else {
                callback();
            }
        }, delay);
    }
}

function turnOnOffTV() {
    if (!isTVOn) {
        isTVOn = !isTVOn;
        $('body').toggleClass('tv-on');
        $('body').removeClass('tv-off');
        $('.volume').attr('data-volume', tvAudioLevel);
        if (!isRedditDown) {
            player = new YT.Player('yt-iframe', {
                width: 1280,
                height: 720,
                videoId: get_video(),
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
        }
        cha.play();
        if (isTVMuted) {
            $('.container').addClass('mute');
        }

    } else if (isTVOn) {
        clearTimeout(autoChannelDelay);
        $('body').toggleClass('tv-on');
        $('body').addClass('tv-off');
        if (isMenuOpen) {
            console.log('tv menu reset');
            menuToggle();
        }
        if (!isRedditDown) player.destroy();
        bga.play();
        isNextSet = !isNextSet;
        isTVOn = !isTVOn;
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
        triggerAnimation(nextChannel, false);
    }, 1000);
}

function onPlayerReady(event) {
    if (isTVMuted) {
        player.mute();
    }
    event.target.setVolume(tvAudioLevel);
    animationCssReset("#yt-contain");
    console.log("Player Ready!");
}

function onPlayerStateChange(event) {
    switch (event.data) {
        case YT.PlayerState.ENDED:
            nextChannel();
            break;
        case YT.PlayerState.PLAYING:
            if (!isNextSet) {
                clearTimeout(autoChannelDelay);
                var acdMS = player.getDuration() * 1000 - delay - 300;
                autoChannelDelay = setTimeout(function () {
                    console.log("Channel auto-changed!");
                    triggerAnimation(nextChannel);
                }, acdMS);
                console.log("Timeout Set on state change!");
                isNextSet = !isNextSet;
            }
            break;
        case YT.PlayerState.PAUSED:
            event.target.playVideo();
            break;
        default:
    }
}

function animationCssReset(selector) {
    $(selector).addClass("reset-animation");
    setTimeout(function () {
        $(selector).removeClass("reset-animation");
    }, 200);
}

function volumeUp() {
    if (isTVOn && !isAudioDucked) {
        if (tvAudioLevel !== 100) {
            tvAudioLevel += 10;
            animationCssReset(".volume");
            $('.volume').attr('data-volume', tvAudioLevel);
        }
        if (isTVMuted) {
            console.log('Un Muted Audio on Volume Raise!');
            mute();
        }
        player.setVolume(tvAudioLevel);
        console.log("Volume Raised!");
    }
}

function volumeDown() {
    if (isTVOn && !isAudioDucked) {
        if (tvAudioLevel === 10) {
            tvAudioLevel -= 10;
            mute();
        } else if (tvAudioLevel > 10) {
            tvAudioLevel -= 10;
            animationCssReset(".volume");
            $('.volume').attr('data-volume', tvAudioLevel);
            player.setVolume(tvAudioLevel);
            console.log("Volume Lowered!");
        }
    }
}

function mute() {
    if (isTVOn && !isAudioDucked) {
        if (!isTVMuted) {
            player.mute();
            //            if (tvAudioLevel === 0){
            //                tvAudioLevel += 10;
            //            }
            $('.container').addClass('mute');
        } else {
            player.unMute();
            $('.container').removeClass('mute');
            animationCssReset(".volume");
        }
        isTVMuted = !isTVMuted;
    }
}

function zoomToggle() {
    $('.container').toggleClass('zoom');
}

function menuToggle() {
    if (isTVOn) {
        $('.container').toggleClass('menu-overlay');
        isMenuOpen = !isMenuOpen;
    }
}


function openVideo() {
    if (isTVOn) {
        window.open(player.getVideoUrl(), '_blank');
    }
}

if (!Array.prototype.randomElement) {
    Array.prototype.randomElement = function () {
        return this[Math.floor(Math.random() * this.length)];
    }
}

if (!Array.prototype.randomPop) {
    Array.prototype.randomPop = function () {
        var index = Math.floor(Math.random() * this.length);
        return this.splice(index, 1)[0];
    };
}

var get_video = (function () {

    var played = [];
    var videos = [];
    //Thank you based regex gods https://github.com/regexhq/youtube-regex/blob/master/index.js
    var youtube_video_regex = new RegExp(/(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\/?\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/);

    var get_api_call = function (time, sort) {
        return `https://www.reddit.com/r/InterdimensionalCable/search.json?q=site%3Ayoutube.com+OR+site%3Ayoutu.be&restrict_sr=on&sort=${sort}&t=${time}&limit=50`;
    };

    var add_youtube_url = function (reddit_post_data) {
        // Check if the URL is for youtube
        if (!youtube_video_regex.test(reddit_post_data.url)) {
            return false;
        }
        // Check to see if the entier video is being linked.
        // If a certain index is being linked, ignore the video.
        if (reddit_post_data.url.indexOf("t=") != -1) {
            return false;
        }
        // Check if a reddit post has less than 1 point.
        // If the post does, ignore it. It is unworthy.
        if (reddit_post_data.score < 1) {
            return false;
        }
        var groups = youtube_video_regex.exec(reddit_post_data.url);
        // TODO: Trim video id?
        var video_id = groups[1]; // 3rd group is the video id.
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
                if (add_youtube_url(child.data)) {
                    console.log("Added " + child.data.url);
                } else {
                    console.log("Ignored " + child.data.url);
                }
            });
            $('.container').removeClass('offline');
            isRedditDown = false;
        }).fail(function () {
            $('.container').addClass('offline');
            isRedditDown = true;
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

var nextChannel = function (noError = true) {

    var pushShow = function () {
        //Code here to push a new list item to the shows container in the HTML, which lists the image of the show, title, and links ot the youtube page.
        var videoInfo = player.getVideoData();
        var videoUrl = player.getVideoUrl();
        var imgUrl = `http://img.youtube.com/vi/${videoInfo.video_id}/mqdefault.jpg`;
        var listNode = $("#list-template li").clone();
        listNode.find(".poster div").css("background-image", `url(${imgUrl})`);
        listNode.find(".video-title").html(videoInfo.title);
        listNode.find(".video-author").html(videoInfo.author);
        listNode.find("a").attr({
            "href": videoUrl,
            "target": "_blank",
            title: videoInfo.title
        });
        listNode.prependTo(".shows");
    }

    var changeChannelName = function () {
        var channelName = ["1", "2", "TWO", "3", "4", "42", "1337", "5", "6", "117", "7", "A113", "8", "9", "10", "🐐", "101", "C137", "👌😂", "🍌", "🍆", "20", "30", "40", "50", "60", "69", "70", "80", "90", "100", "C132", "35C", "J19ζ7"].randomElement();

        $("[data-channel-id]").attr("data-channel-id", channelName);
    }

    var playQuote = function () {
        if (!isAudioDucked) {
            isAudioDucked = true;
            var duckFloat = 0.1;
            console.log("Starting quote playing");
            var audioQuote = ["sexsells", "improv", "relax", "billmurray", "movie"].randomElement();
            qa.src = "audio/quotes/" + audioQuote + ".mp3";
            player.setVolume(audioDuck(1, duckFloat));
            qa.addEventListener("ended", function (e) {
                console.log("Quote playback ended");
                player.setVolume(audioDuck(0, duckFloat, e));
                isAudioDucked = false;
            });
            qa.play();
        }
    }
    var audioDuck = function (direction, value, eventData = "") {
        //    console.log("Current volume level: " + player.getVolume());
        if (eventData !== "") {
            console.log("Removing ended event");
            eventData.target.removeEventListener(eventData.type, function () {});
        }
        var playerVolume = player.getVolume();
        //A direction Value of 1 ducks, whereas a value of 0 reverts
        if (direction) {
            return playerVolume * value;;
        } else {
            return playerVolume / value;;
        }
    }


    var switchChannel = function () {
        if (isTVOn) {
            if (Math.random() <= 0.1) {
                setTimeout(playQuote(), 200);
            }
            clearTimeout(autoChannelDelay);
            console.log("Timeout Removed on channel change!");
            player.loadVideoById(get_video());
            cha.play();
            console.log("Channel Changed!");
            changeChannelName();
            animationCssReset("#yt-contain");
            isNextSet = false;
        }
    }
    return function () {
        if (noError) {
            pushShow();
        }
        switchChannel();
        changeChannelName();
    }
}();

$(function () {
    bgv = document.getElementById("rick-bg");
    bga = document.getElementById("off-audio");
    cha = document.getElementById("switch-audio");
    qa = document.getElementById("quote-player");
    $("#video-url").on({
        "mouseenter": function () {
            if (isTVOn) {
                $(this).attr({
                    "href": player.getVideoUrl(),
                    "target": "_blank"
                });
            }
        },
        "mouseleave": function () {
            $(this).attr("href", "#");
        }
    });
    $("#power").on("click", function () {
        triggerAnimation(turnOnOffTV);
    });
    $("#zoom").on("click", function () {
        triggerAnimation(zoomToggle);
    });
    $("#menu").on("click", function () {
        triggerAnimation(menuToggle);
    });
    $("#mute").on("click", function () {
        triggerAnimation(menuToggle);
    });
    $("#channel-up").on("click", function () {
        triggerAnimation(nextChannel, true);
    });
    $("#volume-up").on("click", function () {
        triggerAnimation(volumeUp);
    });
    $("#volume-down").on("click", function () {
        triggerAnimation(volumeDown);
    });
});
