function Note(len, num) {
  this.len = len;
  this.num = num;
}

function Pattern() {
  this.timeSig = 0;
  this.startOctave = 0;
  this.notes = [];
}

/* Serializes a Pattern to a plain array. */
function serializePattern(pattern) {
  var notes = [];

  for (var i = 0; i < pattern.notes.length; i++) {
    var note = pattern.notes[i];
    notes.push([note[i].len, note[i].num]);
  }

  return [
    pattern.timeSig,
    pattern.startOctave,
    notes
  ];
}

/* Take a serialized Pattern, and returns a Pattern. */
function deserializePattern(array) {
  var pattern = new Pattern();

  pattern.timeSig = array[0];
  pattern.startOctave = array[1];

  var notes = array[2];
  for (var i = 0; i < notes.length; i++) {
    var note = new Note(notes[i][0], notes[i][1]);
    pattern.notes.push(note);
  }

  return pattern;
}

/* num is 0-7
   scaleType is 'm' or 'M' */
function scaleNumToNoteNum(scaleType, num) {
  var mappings = {
    'm': [0, 2, 3, 5, 7, 9, 10],
    'M': [0, 2, 4, 5, 7, 9, 11]
  };

  var octaveOffset = 0;
  var adjustedNum = num;

  while (adjustedNum >= 8) {
    adjustedNum -= 7;
    octaveOffset += 12;
  }
  while (adjustedNum < 0) {
    adjustedNum += 7;
    octaveOffset -= 12;
  }

  var note = mappings[scaleType][adjustedNum] + octaveOffset;

  return note;
}

var patternsRaw = [
  [44, -1, [[3, -3], [3, 0], [3, 2],
            [3, -3], [3, 0], [3, 2],
            [3, -3], [3, 0], [3, 2],
            [3, -3], [3, 0], [3, 2]]],
  [44, 0, [[8, 0], [8, 2], [8, 0], [8, 2], [8, 0], [8, 2], [8, 0], [8, 2]]],
  [44, -2, [[1, 0]]],
  [44, -1, [[3, -5], [3, -3], [3, 0],
            [3, -5], [3, -3], [3, 0],
            [3, -5], [3, -3], [3, 0],
            [3, -5], [3, -3], [3, 0]]]
];

/*
   noteLen=4 -> quarter note
   noteLen=8 -> eigth note
   noteLen=3 -> triplet note
*/
function noteLenToMs(tempo, noteLen) {
  var quarter = 60 / tempo * 1000;
  if (noteLen == 4) {
    return quarter;
  } if (noteLen == 8) {
    return quarter / 2;
  } if (noteLen == 1) {
    return quarter * 4;
  } if (noteLen == 2) {
    return quarter * 2;
  } if (noteLen == 3) {
    return quarter / 3;
  }
}

function Line() {
  this.notes = [];
}

Line.prototype.play = function(tempo) {
  var time = 0;
  for (var i = 0; i < this.notes.length; i++) {
    var note = this.notes[i].num;
    var len = this.notes[i].len;
    var ms = noteLenToMs(tempo, len);
    playNote(note, time, time + ms);
    time += ms;
  }
};

/* noteBase is a plain note string (e.g., "C") */
Line.prototype.addPattern = function(pattern, noteBase, scaleType, octaveOffset) {
  var note = MIDI.keyToNote[noteBase + (5 + pattern.startOctave + octaveOffset)];

  for (var i = 0; i < pattern.notes.length; i++) {
    var num = pattern.notes[i].num;
    var len = pattern.notes[i].len;
    this.notes.push(new Note(len, note + scaleNumToNoteNum(scaleType, num)));
  }
}

function playNote(note, time, len) {
  setTimeout(function() {
    MIDI.noteOn(0, note, 127, 0);
    MIDI.noteOff(0, note, 127, 0 + len);
  }, time);
}
