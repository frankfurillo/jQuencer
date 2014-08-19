(function(window, $) {
	       	"use strict"
var jQuencer={
	ctx:null,
	query:null,
	pause:true,
    commands: ["sequence", "single"],
    vca:null,
    st: "",
    defaults : {
        maxFrequency: 4000
    },

    //EXE http://localhost/AngularSpa3/jQuencer/index.html?{%22command%22:%22sequence%22,%22notes%22:[12,24]}
    init:function(loadedFunction) {
        if (this.ctx!=null) {
            //already initialized
            this.start();
            return;
        }
        this.pause=false;
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.vca = this.ctx.createGain();
        this.vca.connect(this.ctx.destination);
        try{
            this.query = JSON.parse(unescape(window.location.search.substring(1)))
            if (this.query.command == "sequence") {
                if (typeof (query.tempo) != "undefined") {
                    this.tempoCalculator.defaultTempo = this.tempoCalculator.msFromBpm(parseInt(this.query.tempo));
                }
                query.notes.forEach(function (note) {
                    var oscillatorList = [{ type: "sawtooth", freq: note }, { type: "sine", freq: (note+500) }];
                    this.sequencer.addStep(oscillatorList);
                });
                sequencer.run();
            }
        }
        catch (e) {
            //non json query

            this.sequencer.run();
        }


        loadedFunction(this.ctx);
    },





    tempoCalculator : {
        msFromBpm: function (bpm) {
            return 60000 / bpm;
        }
        ,
        defaultTempo: 500,
        changeTempo: function (bpm) {
            this.defaultTempo = this.msFromBpm(bpm);
        }
    }
    ,
    sequencer : {
        stepStarted:$.Event("StepStarted"),
        stepStopped: $.Event("StepStopped"),
        currentIndex: 0,
        steps : [],
        stopPreviousStep: function () {
            //return;
            if (this.steps.length == 0) {
                return;
            }
            if (this.currentIndex < 0) {
                return;
            }
            var workOnIndex = this.currentIndex - 1;
            if (this.currentIndex == 0) {
                workOnIndex = this.steps.length - 1; //take last in list if firstIsPlaying
            }
            var oList = this.steps[workOnIndex].oscillators;
            oList.forEach(function (osc) {
                if (typeof (osc.oscillator) != "undefined") {

                    //osc.oscillator.stop(0);
                    //osc.oscillator.disconnect();
                }
            });

        }
            ,
            getOscillator:function(stepIndex,oscillatorIndex){
	          return this.steps[stepIndex].oscillators[oscillatorIndex];  
            },
        addStep: function (oscillatorList) {
            this.steps.push(new jQuencer.sequenceStep(oscillatorList));
            return this.steps.length - 1; //index of added step
        },
        addToStep:function(index,type,freq){
            //if (index > this.steps.length - 1) { throw "step out of range"; }
            var newOsc={ type: type, freq: freq };
            if (index > this.steps.length - 1) { //add one if missing
                this.steps.push(new jQuencer.sequenceStep([newOsc]));
                return 0;
            }
            this.steps[index].oscillators.push(newOsc);
            return this.steps[index].oscillators.length-1; //return index of added oscillator
        },
        removeFromStep:function(stepIndex,oscillatorIndex){
	      this.steps[stepIndex].oscillators.splice(oscillatorIndex,1);  
        },
        timerCount:0,
		playAllSteps: function () {
			if (this.steps.length == 0) { return; }
			$("body").trigger(jQuencer.sequencer.stepStarted);
			this.currentIndex=0;
			for (var i = 0; i < this.steps.length; i++) {
			    var n = jQuencer.ctx.currentTime;
			    this.timerCount++;
			    this.currentIndex++;
				var stepCurr = n+(this.timerCount*jQuencer.tempoCalculator.defaultTempo);
				var oList = this.steps[i].oscillators;
				oList.forEach(function (osc) {

					jQuencer.vca.gain.cancelScheduledValues(stepCurr);
					jQuencer.vca.gain.setValueAtTime(0, stepCurr);
					var topVol = 0.9 / oList.length; //
					if (jQuencer.pause) {
						topVol = 0;
					}
					jQuencer.vca.gain.linearRampToValueAtTime(topVol, stepCurr + 0.1);
					var decay = 0.3;
					jQuencer.vca.gain.linearRampToValueAtTime(0.0, stepCurr + decay);
					// jQuencer.vca.connect(jQuencer.ctx.destination);

					var o = jQuencer.ctx.createOscillator();
					o.type = osc.type;
					o.frequency.value = osc.freq;
					o.connect(jQuencer.vca);
					o.start(stepCurr);
					o.stop(stepCurr + (decay + 0.2));
					o.onended = function () {
						o.disconnect();
						$("body").trigger(jQuencer.sequencer.stepStopped);

					};
					osc.oscillator = o;

				});
			}
				if (this.timerCount < 100) { //dont batch forever
					//start over if no stop action is taken
					//if (!this.stop) {
						this.playAllSteps();
					//}
				}

		},
        playStep: function () {
            if (this.steps.length == 0) { return;}
            var oList = this.steps[this.currentIndex].oscillators;
           // var oListLength = oList.length;
            oList.forEach(function (osc) {

                var n = jQuencer.ctx.currentTime;
                jQuencer.vca.gain.cancelScheduledValues(n);
                jQuencer.vca.gain.setValueAtTime(0, n);
                var topVol = 0.9/oList.length; //
                if(jQuencer.pause){
	                topVol=0;
                }
                jQuencer.vca.gain.linearRampToValueAtTime(topVol, n + 0.1);
                var decay=0.3;
                jQuencer.vca.gain.linearRampToValueAtTime(0.0, n +decay);
               // jQuencer.vca.connect(jQuencer.ctx.destination);

                var o = jQuencer.ctx.createOscillator();
                o.type = osc.type;
                o.frequency.value = osc.freq;
                o.connect(jQuencer.vca);
                o.start(0);
                o.stop(n+(decay+0.2));
                o.onended = function () {
                    o.disconnect();
                    $("body").trigger(jQuencer.sequencer.stepStopped);

                };
                osc.oscillator = o;

            });
            $("body").trigger(jQuencer.sequencer.stepStarted);

        }
        ,
        
        run: function () {
            //this.stopPreviousStep();
            //this.playAllSteps(); //UNDER CONSTRUCTION
			//return;
			this.playStep();
            this.currentIndex++;


            clearTimeout(this.st);
            //gCind = currentIndex;
            this.st = setTimeout(function () {
                if (jQuencer.sequencer.currentIndex > jQuencer.sequencer.steps.length - 1) {
                    jQuencer.sequencer.currentIndex = 0;
                }
                jQuencer.sequencer.run();

            }, jQuencer.tempoCalculator.defaultTempo);

        }

    },

   

    sequenceStep:function(arrOscillatorList) {
        this.oscillators = arrOscillatorList || [];
        this.index = jQuencer.sequencer.currentIndex;
        //this.type = type;
        //this.freq = freq;
    }

    ,

    stop:function() {
        this.pause=true;//not implemented
    },

    start:function() {
        this.pause=false;

    },
    
 }
  window.jQuencer = jQuencer;
})(window,jQuery)