(function urlSynth(window, $) {
    var ctx,query;
    var commands = ["sequence", "single"];
    var slaskO, vca, seq;
    var st = "";
    //var currentIndex = 0;
    //EXE http://localhost/AngularSpa3/urlSynth/index.html?{%22command%22:%22sequence%22,%22notes%22:[12,24]}
    function init(loadedFunction) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContext();
        query = JSON.parse(unescape(window.location.search.substring(1)))
        vca = ctx.createGain();

        if (query.command == "sequence") {
            if (typeof(query.tempo) != "undefined") {
                tempoCalculator.defaultTempo = tempoCalculator.msFromBpm(parseInt(query.tempo));
            }
            seq = new sequencer();
            query.notes.forEach(function (note) {
                seq.addStep("sawtooth", note);
            });
            seq.run();
        }

        loadedFunction(ctx);
    }

    var tempoCalculator = {
        msFromBpm: function (bpm) {
            return 60000 / bpm;
        }
        ,
        defaultTempo:500
    }

    function sequencer() {
        this.currentIndex = 0;
        this.steps = [];
    }

    sequencer.prototype.addStep = function (type,freq) {
        this.steps.push({ step: new sequenceStep(typeof (type) != "undefined" ? type : "sine",freq), oscillator: null });
    }
    sequencer.prototype.playStep = function () {
        var o= ctx.createOscillator();
        o.type = this.steps[this.currentIndex].step.type;
        o.frequency.value = this.steps[this.currentIndex].step.freq;
        o.start(0);
        o.connect(vca);
        this.steps[this.currentIndex].oscillator = o;
        vca.connect(ctx.destination);

    };
    sequencer.prototype.stopPreviousStep = function () {
        if (this.currentIndex < 0) {
            return;
        }
        var workOnIndex = this.currentIndex - 1;
        if (this.currentIndex == 0) {
            workOnIndex = query.notes.length - 1; //take last in list if firstIsPlaying
        }
        var o = this.steps[workOnIndex].oscillator;
        if (o != null) {
            o.stop(0);
            o.disconnect();
        }
    };

    function sequenceStep(type,freq) {
        this.type = type;
        this.freq = freq;
    }

    sequencer.prototype.run = function () {
        this.stopPreviousStep();
        this.playStep();
        this.currentIndex++;


        clearTimeout(st);
        //gCind = currentIndex;
        st = setTimeout(function () {
            if (seq.currentIndex> query.notes.length - 1) {
                seq.currentIndex = 0;
            }
            seq.run();

        }, tempoCalculator.defaultTempo);

    }


    function stop() {
        vca.gain.value = 0;
    }

    function start() {
        vca.gain.value = 1;
    }




    this.init = init;
    this.stop = stop;
    this.start = start;
    window.urlSynth = this;
})(window,jQuery)