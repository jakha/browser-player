
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
								jjModel.nowWePlayingFormat = jjModel.HLS;
								jjModel.player = new Hls();
								jjModel.player.loadSource(jjModel.source);	
								jjModel.player.attachMedia(jjModel.videoFrame);
								jjModel.player.on(Hls.ErrorDetails.LEVEL_LOAD_ERROR, function(){
									throw new Error("file not found")
								});								
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
					
					if(isNaN(playerDuration)){
						throw new Error("Problems with file load, probably file not found, change url or press play again");
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
				that.progressbar  =  {
										dom:document.getElementById('progressbar'),
										slider: document.getElementById('myProgress'),
										max: 0,
										value: 0,
										step:0,
										getTime: function (position)
												{
													that.progressbar.step = that.progressbar.rect.width / that.progressbar.max;
													let seekTime = (position - that.progressbar.rect.left) / that.progressbar.step;
													return seekTime;
												},
										setTime: function(sec)
												{
													that.progressbar.step = that.progressbar.rect.width / that.progressbar.max;
													console.log(that.progressbar.step);
													console.log(sec * that.progressbar.step);
													that.progressbar.slider.style.left = (sec * that.progressbar.step) + "px";
												}		
									}
									
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
				
				that.progressbar.dom.addEventListener('click', function(e)
				{
					let time = that.progressbar.getTime(e.clientX);
					that.playerModel.seek(time);
					that.progressbar.slider.style.left = e.clientX;
				});

		
				initPlayerModel();
		

				source.addEventListener('blur', function(e)
				{
					initPlayerModel();
				});

				function adaptizeWidthForScreen()
				{
					that.videoFrame.style.width = screen.width/2 + "px";
					source.style.width = screen.width/3 + "px";
					that.progressbar.dom.style.width = screen.width/2 - 100 + "px";
					that.progressbar.rect = that.progressbar.dom.getBoundingClientRect(),
					that.videoFrame.style.height = screen.height/2 + "px";
				}

				function setDurationOnView ()
				{
					that.printInfo("");
					try{
						let playerDuration = that.playerModel.duration();
						that.progressbar.max = playerDuration.fullTimeBySec;
						document.getElementById('duration').innerHTML = playerDuration.inMin + ":" + playerDuration.inSec;
					}
					catch(e){
						that.printInfo(e);
					}
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
						that.playerModel = null;
						that.printInfo(e);
					}
				}

				function setTimeOnView()
				{
					let time = that.playerModel.time();
					that.progressbar.setTime(time.timeBySec);
					document.getElementById('currentTime').innerHTML =  time.min + ":" + time.sec;
				}	
			};

			jjPlayerController.prototype.printInfo = function(text)
			{	
				if(text == "")
				{
					text = 'Evrithing is ok';
					this.info.style.color = '#FFF0F5';
				}
				else
				{
					this.info.style.color = 'red';
				}
				this.info.innerHTML = text;
			};
