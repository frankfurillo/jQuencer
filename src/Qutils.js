(function (window, $) {
    "use strict"

    var Qutils = {
  
        fx: {

        }
        ,
        noteToFrequency : function (note) {
            var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'],
                key_number,
                octave;

            if (note.length === 3) {
                octave = note.charAt(2);
            } else {
                octave = note.charAt(1);
            }

            key_number = notes.indexOf(note.slice(0, -1));

            if (key_number < 3) {
                key_number = key_number + 12 + ((octave - 1) * 12) + 1;
            } else {
                key_number = key_number + ((octave - 1) * 12) + 1;
            }

            return 440 * Math.pow(2, (key_number - 49) / 12);
        }
    }
    window.Qutils = Qutils;
})(window, jQuery)