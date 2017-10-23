
			function jjPlayerModel(source, videoFrame)
			{				
				jjModel = this;

				Object.defineProperty(jjModel, "DASH", {
												  value: 1,
												  writable: false,
												  configurable: false 
												});
				Object.defineProperty(jjModel, "HLS", {
													  value: 2,
													  writable: false,
													  configurable: false
													});	
				jjModel.videoFrame = videoFrame;
				
				validateSource(source);

				function validateSource(source)
				{
					jjModel.source = source;
					let ext = source.split('.').pop(); 
					switch(ext)
					{
						case 'mpd':
							if (typeof (window.MediaSource) === "function") { 
								try{
									jjModel.nowWePlayingFormat = jjModel.DASH;
									jjModel.player = dashjs.MediaPlayer().create();
									jjModel.player.initialize(jjModel.videoFrame, jjModel.source, false);
								}
								catch(e)
								{
									throw new Error(e);
								}
							}
							else
							{
								throw new Error("browser not support .mpd format");
							}
					 		break;
				 		case 'm3u8':
							if(Hls.isSupported())
							{
								try{
									jjModel.nowWePlayingFormat = jjModel.HLS;
									jjModel.player = new Hls();
									jjModel.player.loadSource(jjModel.source);
									jjModel.player.attachMedia(jjModel.videoFrame);
									jjModel.player.on(Hls.Events.MEDIA_ATTACHED, function () {
											console.log("video and hls.js are now bound together !");
									});
								}
								catch(e)
								{
									throw new Error(e);
								}
							}
							else
							{
								throw new Error("browser not support .hls format");
							}
				 			break;
				 		default:
				 			throw new Error ("player don't support ." + ext + " format");
					}
				}

				jjModel.stop = function ()
				{
					switch(this.nowWePlayingFormat)
					{
						case this.DASH:
							this.player.pause();
							break;
						case this.HLS:
							this.player.media.pause();
							break;
						default:
							throw new Error("There is nothing to play. Make sure the url is correct");
							break;
					}
				};

				jjModel.play = function () 
				{
					jjModel = this;
					switch(jjModel.nowWePlayingFormat)
					{
						case jjModel.DASH:
							jjModel.player.play();
							break;
						case jjModel.HLS:
						   	jjModel.videoFrame.play();
							break;
						default:
							throw new Error("There is nothing to stop. Make sure the url is correct");
							break;
					}
				};

				jjModel.duration = function () 
				{
					let playerDuration = '';

					switch(this.nowWePlayingFormat)
					{
						case this.DASH:
							playerDuration = this.player.duration();
							break;
						case this.HLS:
							playerDuration = this.player.media.duration;
							break;
					}

					let durForView = playerDuration/60;
					let durByMinAsArr = durForView.toFixed(2).split('.');
					return {
						fullTimeBySec: playerDuration,
						inMin: durByMinAsArr[0],
						inSec: durByMinAsArr[1]
					}
				};

				jjModel.time = function()
				{
					let time;
					switch(this.nowWePlayingFormat)
					{
						case this.DASH:
							time = this.player.time();
							break;
						case this.HLS:
							time = this.player.media.currentTime
							break;
					}

					return {
						timeBySec: time,
						min: Math.floor(time/60),
						sec: Math.trunc(time%60)
					}
				};

				jjModel.seek = function (time)
				{
					switch(this.nowWePlayingFormat)
					{
						case this.DASH:
							this.player.seek(time);
						case this.HLS:
							this.player.media.currentTime = time;
							break;
					}
				};
			}

			function jjPlayerController ()
			{
				let that = this;

				that.videoFrame =  document.getElementById('videoPlayer');
				that.progressbar  = document.getElementById('myProgress');
				that.intervalId = '';

				let source = document.getElementById('source');

				adaptizeWidthForScreen();

				that.playButton = document.getElementById('play');
				that.stopButton = document.getElementById('stop');
				that.info = document.getElementById('info');

				that.playButton.addEventListener('click', function(e)
				{
					that.playerModel.play();
					setDurationOnView();
					that.intervalId = setInterval(setTimeOnView, 1000);

				});

				that.stopButton.addEventListener('click', function(e)
				{
					that.playerModel.stop();
					clearInterval(that.intervalId);
				});

				that.progressbar.addEventListener('click', function(e)
				{
					let time =  calculateSearchTime(e.clientX);
					that.playerModel.seek(time);
					that.progressbar.value = time;
				});

		
				initPlayerModel();
		

				source.addEventListener('change', function(e)
				{
					initPlayerModel();
				});

				function calculateSearchTime(position)
				{
					let rectSize = that.progressbar.getBoundingClientRect();
					let step = rectSize.width / that.progressbar.max;
					let seekTime = (position - rectSize.left) / step;
					return seekTime;
				}

				function adaptizeWidthForScreen()
				{
					that.videoFrame.style.width = screen.width/2 + "px";
					source.style.width = screen.width/3 + "px"
					that.progressbar.style.width = screen.width/2 - 100 + "px";
					that.videoFrame.style.height = screen.height/2 + "px";
				}

				function setDurationOnView ()
				{
					let playerDuration = that.playerModel.duration();
					that.progressbar.max = playerDuration.fullTimeBySec;
					document.getElementById('duration').innerHTML = playerDuration.inMin + ":" + playerDuration.inSec;
				}

				function initPlayerModel()
				{
					that.playerModel = null;
					try{
						
						that.playerModel = new jjPlayerModel(source.value, that.videoFrame);
						that.printInfo('');
					}
					catch(e)
					{
						that.printInfo(e);
					}
				}

				function setTimeOnView()
				{
					let time = that.playerModel.time();

					that.progressbar.value = time.timeBySec;
					document.getElementById('currentTime').innerHTML =  time.min + ":" + time.sec;
				}
			};

			jjPlayerController.prototype.printInfo = function(text)
			{	
				if(text == "")
				{
					text = 'Evrithing is ok';
					this.info.style.color = '#1b2431';
				}
				else
				{
					this.info.style.color = 'red';
				}
				this.info.innerHTML = text;
			};
