(function($){

    // KEYBOARD

    var DictKey = {
        90 : 48, // Z -> C3
        83 : 49, // S -> C+3
        88 : 50, // X -> D3
        68 : 51, // D -> D+3
        67 : 52, // C -> E3
        86 : 53, // V -> F3
        71 : 54, // G -> F+3
        66 : 55, // B -> G3
        72 : 56, // H -> G+3
        78 : 57, // N -> A3
        74 : 58, // J -> A+3
        77 : 59, // M -> B3
        188: 60, // , -> C4
        76 : 61, // L -> C+4
        190: 62, // . -> D4
        186: 63, // ; -> D+4

        81 : 60, // Q -> C4
        50 : 61, // 2 -> C+4
        87 : 62, // W -> D4
        51 : 63, // 3 -> D+4
        69 : 64, // E -> E4
        82 : 65, // R -> F4
        53 : 66, // 5 -> F+4
        84 : 67, // T -> G4
        54 : 68, // 6 -> G+4
        89 : 69, // Y -> A4
        55 : 70, // 7 -> A+4
        85 : 71, // U -> B4
        73 : 72, // I -> C5
        57 : 73, // 9 -> C#5
        79 : 74, // O -> D5
        48 : 75, // 0 -> D+5
        80 : 76  // P -> E5
    };

    var keyDown  = {};
    var currentKey = '';
    var previousKey = '';

    var onkeydown = function(e) {
        console.log(e.keyCode);
        if (!keyDown[e.keyCode]) {
            keyDown[e.keyCode] = true;
            previousKey = currentKey;
            currentKey = e.keyCode;
            play(DictKey[currentKey]);
        }

    };

    var onkeyup = function(e) {
        delete keyDown[e.keyCode];
        if ($.isEmptyObject(keyDown)) {
            currentKey = '';
        } else if (currentKey == e.keyCode && keyDown[previousKey]) {
            currentKey = previousKey;
        }
        play(DictKey[currentKey]);

    };

    window.addEventListener("keydown", onkeydown, true);
    window.addEventListener("keyup"  , onkeyup  , true);

    // KNOBS

    var knobOsc1Val = 0;
    var knobOsc2Val = 0;

    nx.onload = function() {

	    nx.sendsTo("js");

	    knobOsc1.response = function(data) {
            var oldRange = 1 - 0;
            var newRange = 16 - (-16); // 2 octaves = 16 semitones
            var semitones = ((data * newRange) / oldRange) + (-16);
            knobOsc1Val = semitones;
            osc1.frequency.setValueAtTime(
                getOsc1Freq(), context.currentTime);
            osc2.frequency.setValueAtTime(
                getOsc2Freq(), context.currentTime);
	    };

	    knobOsc2.response = function(data) {
            var oldRange = 1 - 0;
            var newRange = 28 - (-28); // 3.5 octaves = 16 semitones
            var semitones = ((data * newRange) / oldRange) + (-28);
            knobOsc2Val = semitones;
            osc2.frequency.setValueAtTime(
                getOsc2Freq(), context.currentTime);
	    };

        knobXmod.value = 0;
	    knobXmod.response = function(data) {
            osc2XmodMix.gain.value = data;
            osc1.frequency.setValueAtTime(
                getOsc1Freq(), context.currentTime);
            osc2.frequency.setValueAtTime(
                getOsc2Freq(), context.currentTime);
	    };

	    knobCutoff.response = function(data) {
            var oldRange = 1 - 0;
            var newRange = 120 - 25;
            var semitones = ((data * newRange) / oldRange) + 25;
            lowpassFilter.frequency.setValueAtTime(
                getFrequency(semitones), context.currentTime);
            console.log(semitones);
	    };

	    knobPeak.response = function(data) {
            var oldRange = 1 - 0;
            var newRange = 1.5 - (-1);
            var value = Math.pow(10, ((data * newRange) / oldRange) + (-1));
            lowpassFilter.Q.setValueAtTime(
                value, context.currentTime);
	    };

	    toggleOsc2.response = function(data) {
            if (!data) {
                osc2Gain.gain.value = 0.0;
            } else if (!$.isEmptyObject(keyDown)) {
                osc2Gain.gain.value = 1.0;
            }
	    };

	};

    // AUDIO

    var settings = {
            id: 'keyboard',
            startNote: 'A4',
            octaves: 2,
            width: 620,
            activeColour: '#FF5F13',
        };
    var keyboard = new QwertyHancock(settings);

    var context = new window.AudioContext();
    var masterGain = context.createGain();
    var lowpassFilter = context.createBiquadFilter();
    masterGain.gain.value = 0.3;
    masterGain.connect(lowpassFilter);
    lowpassFilter.connect(context.destination);

    var osc1 = context.createOscillator();
    var osc1Gain = context.createGain();
    var osc1XmodMix = context.createGain();
    osc1.type = 'square';
    osc1.connect(osc1Gain);
    osc1Gain.connect(masterGain);
    osc1Gain.gain.value = 0.0;
    osc1Gain.connect(osc1XmodMix);
    osc1XmodMix.connect(masterGain);
    osc1XmodMix.gain.value = 0.0;
    osc1.start(0);

    var osc2 = context.createOscillator();
    var osc2Gain = context.createGain();
    osc2.type = 'saw';
    osc2.connect(osc2Gain);
    osc2Gain.connect(masterGain);
    osc2Gain.gain.value = 0.0;
    osc2.start(0);

    var osc2XmodMix = context.createGain();
    osc2XmodMix.gain.value = 0.5;
    osc2.connect(osc2XmodMix);
    osc2XmodMix.connect(osc1XmodMix.gain);

    var getFrequency = function(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    };

    lowpassFilter.frequency.setValueAtTime(
        getFrequency(72.5), context.currentTime);

    var getOsc1Freq = function() {
        var semitones = DictKey[currentKey] + knobOsc1Val + knobXmod.val;
        return getFrequency(semitones);
    };

    var getOsc2Freq = function() {
        var semitones = DictKey[currentKey] + knobOsc2Val;
        return getFrequency(semitones) + getOsc1Freq();
    };

    var play = function (note) {
        if (note) {
            osc1.frequency.setValueAtTime(
                getOsc1Freq(), context.currentTime);
            osc2.frequency.setValueAtTime(
                getOsc2Freq(), context.currentTime);
            osc1Gain.gain.value = 1.0;
            if (toggleOsc2.val) {
                console.log(toggleOsc2.val);
                osc2Gain.gain.value = 1.0;
            }
        } else {
            osc1Gain.gain.value = 0.0;
            osc2Gain.gain.value = 0.0;
        }

    };


})(jQuery);

