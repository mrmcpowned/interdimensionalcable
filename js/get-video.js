Math.random=(function(rand) {
	var salt=0;
	document.addEventListener('mousemove',function(event) {
		salt=event.pageX*event.pageY;
	});
	return function() { return (rand()+(1/(1+salt)))%1; };
})(Math.random);

if (!Array.prototype.randomPop) {
	Array.prototype.randomPop = function () {
		var index = Math.floor(Math.random() * this.length);
		return this.splice(index, 1)[0];
	};
}


if (!Array.prototype.randomElement) {
	Array.prototype.randomElement = function () {
		return this[Math.floor(Math.random() * this.length)];
	};
}



function animate_object(selector) {

	var reset = function () {
		// TODO: Will this work?
		$(selector).toggleClass("reset-animation");
	};

	reset();
	setTimeout(reset, 200);
}

$(function () {
	var get_next_post = (function () {

		var youtube_video_regex = new RegExp(/(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\/?\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/);

		var videos = [], played = [];

		var get_api_call = function (time, sort) {
			return `https://www.reddit.com/r/InterdimensionalCable/search.json?q=site%3Ayoutube.com+OR+site%3Ayoutu.be&restrict_sr=on&sort=${sort}&t=${time}&limit=500`;
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
			// Check if a reddit post has less than 25 points.
			// If the post does, ignore it. It is unworthy.
			if (reddit_post_data.score < 5) {
				return false;
			}
			var groups = youtube_video_regex.exec(reddit_post_data.url);
			// TODO: Trim video id?
			var video_id = groups[1]; // 2nd group is the video id.
			if (played.indexOf(video_id) != -1) {
				return false;
			}
			videos.push({
				"video": video_id,
				"link": `https://www.reddit.com${reddit_post_data.permalink}`
			});
			played.push(video_id);
			return true;
		};



		var load_posts = function () {
			var sort = ["relevance", "hot", "top", "new", "comments"].randomElement();

			var url = get_api_call('all', sort);
			$.getJSON(url, function (api_response) {

				api_response.data.children.forEach(function (child) {
					if (add_youtube_url(child.data)) {
						console.log("Added " + child.data.url);
					} else {
						console.log("Ignored " + child.data.url);
					}
				});

			}).fail(function () {
				// Re-Poll on timeout/parse failure
				setTimeout(load_videos, 5000);
			});


		};

		load_posts();

		var get_next_post = function () {
			// We ran out of videos
			// Reddit is likely off
			if (videos.length == 0) {
				return null;
			}
			// We need to cache more videos
			if (videos.length < 5) {
				load_posts();
			}
			return videos.randomPop();
		};


		return get_next_post;
	})();

	var sound_effect = (function () {
		var sounds = {
			"off": document.getElementById("off-audio"),
			"switch": document.getElementById("switch-audio"),
		};
		return function (callback, effect) {
			var sound_effect = sounds[effect];
			return function () {
				sound_effect.play();
				callback();
			};
		};
	})();

	var animation = (function () {

		var background_animation = document.getElementById("rick-bg");
		var crt_click = document.getElementById("off-audio");

		var last_timeout_id = undefined;

		return function (callback, external) {


			var duration = background_animation.duration * 1000;

			if (last_timeout_id !== undefined) {
				console.log("Clearing last timeout");
				clearTimeout(last_timeout_id);
				//return false;
			}

			if (external === undefined) {
				external = 0;
			} else {
				external -= 800;
			}

			var click_offset = duration - 800;

			var arg_count = arguments.length;
			var callback_args = Array.prototype.slice.call(arguments, 1, arg_count - 1);

			setTimeout(function () {

				background_animation.play();

				last_time_id = setTimeout(function () {
					callback.apply(this, callback_args);
					last_time_id = undefined;
				}, click_offset);

			}, external);

			return true;
		};
	})();


	var animate_callback = function (callback) {
		return function () {
			if (animation(callback)) {
				return;
			}
			callback();
		};
	};

	var volume_controller = function (player) {

		var playing_clip = false;
		var quote_player = document.getElementById("quote-player");

		var guard = function (other) {
			return function () {
				if (playing_clip) {
					return;
				}
				other.apply(this, arguments);
			}
		};

		var toggle_mute = function () {
			if (player.isMuted()) {
				player.unMute();
				animate_object(".volume");
			} else {
				player.mute();
			}
			$(".container").toggleClass("mute");
		};

		var set_volume = function (volume) {
			$(".volume").attr("data-volume", volume);
			animate_object(".volume");
			player.setVolume(volume);
		};

		var volume_up = function () {

			if (player.getVolume() == 100) {
				return;
			}

			if (player.isMuted()) {
				// Unmute the player
				toggle_mute();
			}

			set_volume(player.getVolume() + 10);
		};

		var volume_down = function () {

			if (player.getVolume() == 0) {
				return;
			}

			set_volume(player.getVolume() - 10);

			if (player.getVolume() == 0) {
				toggle_mute();
			}

		};

		var play_clip = function (audio_clip) {

			var initial_volume = player.getVolume();
			var ducked_volume = initial_volume / 10;

			player.setVolume(ducked_volume);

			quote_player.src = audio_clip;

			quote_player.addEventListener("ended", function (e) {
				player.setVolume(initial_volume);
			});

			quote_player.play();

		};

		set_volume(50);

		return [toggle_mute, volume_up, volume_down, play_clip].map(guard);

	};

	var channel_manager = function (player, get_next_video, play_clip) {
		var channel_names = ["1", "2", "TWO", "3", "4", "42", "1337", "5", "6", "117", "💵", "💰", "7", "A113", "8", "AMMEL", "9", "10", "🐐", "101", "C137", "👌😂", "🍌", "🍆", "20", "30", "40", "50", "60", "69", "70", "80", "90", "100", "/co/", "C132", "35C", "J19ζ7"];
		var quotes = ["sexsells", "imporv", "relax", "billmurray", "movie"];

		var handle_quote = function () {

			// Only allow 10% of cases into this function
			if (Math.random() > .1) {
				return;
			}
			var clip_name = `audio/quotes/${quotes.randomPop()}.mp3`;
			play_clip(clip_name);

		};

		var next_channel = function () {
			// Set channel name
			$("[data-channel-id]").attr("data-channel-id", channel_names.randomPop());

			var video = get_next_video();

			// Display to the user that we ran out of video
			// This is probably from Reddit not responding to API requests.
			if (video === null) {
				$('.container').addClass('offline');
				var with_sound = sound_effect(next_channel, "switch");
				setTimeout(animate_callback(with_sound), 1000);
				return;
			}

			$('.container').removeClass('offline');

			handle_quote();

			player.loadVideoById(video);

		};

		return next_channel;
	};

	var tv_toggle = (function () {

		var player = null;
		var player_switch_handler = 0;

		var add_current_channel = function () {

			var videoInfo = player.getVideoData();
			var videoUrl = player.getVideoUrl();

			var imgUrl = `http://img.youtube.com/vi/${videoInfo.video_id}/mqdefault.jpg`;

			var listNode = $("#list-template li").clone();

			listNode.find(".poster div").css("background-image", `url(${imgUrl})`);
			listNode.find(".video-title").text(videoInfo.title);
			listNode.find(".video-author").text(videoInfo.author);

			listNode.find("a").attr({
				"href": videoUrl,
				"target": "_blank",
				title: videoInfo.title
			});
			listNode.prependTo(".shows");
		}

		var get_next_video = function () {
			var post = get_next_post();
			$("#video-url").attr({
				"href": post.link,
				"target": "_blank"
			});
			return post.video;
		};

		var toggle_tv_classes = function () {
			$("body").toggleClass("tv-on");
			$("body").toggleClass("tv-off");
		};

		var on_ready = function (event) {
			let [toggle_mute, volume_up, volume_down, play_clip] = volume_controller(player);

			// Volume control
			$("#mute").on("click", animate_callback(toggle_mute));
			$("#volume-up").on("click", animate_callback(volume_up));
			$("#volume-down").on("click", animate_callback(volume_down));

			var next_channel = channel_manager(player, get_next_video, play_clip);

			// Move to the next channel
			$("#channel-up").on("click", animate_callback(sound_effect(function () {
				if (!isNaN(player.getDuration())) {
					add_current_channel();
				}
				next_channel();
			}, "switch")));

			$("#menu").on("click", animate_callback(function () {
				$('.container').toggleClass('menu-overlay');
			}));

			// Start the set of videos
			//$("#channel-up").click();
		};

		var on_state_change = function (event) {
			switch (event.data) {
				case YT.PlayerState.ENDED:
					var last_url = player.getVideoUrl();
					setTimeout(function () {
						if (player_switch_handler == null) {
							return;
						}
						if (last_url !== player.getVideoUrl()) {
							return;
						}
						console.log("ENDED event");
						$("#channel-up").click();
					}, 50);
					return;
				case YT.PlayerState.PLAYING:
					clearTimeout(player_switch_handler);
					player_switch_handler = setTimeout(function () {
						console.log("Running PLAYING event");
						$("#channel-up").click();
						player_switch_handler = null;
					}, (player.getDuration() * 1000) - 900);
					return;
				case YT.PlayerState.PAUSED:
					event.target.playVideo();
					return;
			}
		};

		var on_error = function (event) {
			console.log("On Error Event");
			$("#channel-up").click();
		};

		var create_player = function () {
			return new YT.Player("yt-iframe", {
				width: 1280,
				height: 720,
				videoId: get_next_video(),
				playerVars: {
					"autoplay": 1,
					"controls": 0,
					"showinfo": 0,
					"rel": 0,
					"iv_load_policy": 3,
					"disablekb": 1
				},
				events: {
					"onReady": on_ready,
					"onStateChange": on_state_change,
					"onError": on_error
				}
			});
		};


		return function () {

			toggle_tv_classes();

			if (player !== null) {

				player.destroy();

				var handlers = ["#menu", "#mute", "#channel-up", "#volume-up", "#volume-down", "#video-url"];

				handlers.forEach(function (item) {
					$(item).off("click");
				});

				// Make sure we disable the menu.
				$('.container').removeClass('menu-overlay');


				// Make sure we can restart the TV
				player = null;

				return;
			}

			player = create_player();

		};
	})();

	$("#power").on("click", animate_callback(sound_effect(tv_toggle, "off")));
	$('body').addClass('tv-off');

	$("#zoom").on("click", animate_callback(function () {
		$('.container').toggleClass('zoom');
	}));
});
