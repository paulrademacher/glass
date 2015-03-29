function Note(len, nums) {
  this.len = len;

  if (typeof nums == 'number') {
    nums = [nums];
  }
  this.nums = nums;
}

function Score(timeSig) {
  this.timeSig = timeSig;
  this.left = new Line(timeSig);
  this.right = new Line(timeSig);
}

function Pattern() {
  this.timeSig = 0;
  this.startOctave = 0;
  this.notes = [];
}

function PatternInstance(repeats, pattern, noteBase, scaleType, octaveOffset) {
  this.repeats = repeats;
  this.pattern = pattern;
  this.noteBase = noteBase;
  this.scaleType = scaleType;
  this.octaveOffset = octaveOffset;
}

/* Serializes a Pattern to a plain array. */
function serializePattern(pattern) {
  var notes = [];

  for (var i = 0; i < pattern.notes.length; i++) {
    var note = pattern.notes[i];
    notes.push([note[i].len, note[i].nums]);
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

function timeSigToBeats(timeSig) {
  if (timeSig == 34) {
    return 3;
  } else if (timeSig == 44) {
    return 4;
  }
}

/* num is 0-7
   scaleType is 'm' or 'M' */
function scaleNumToNoteNum(scaleType, num) {
  var mappings = {
    'm':  [0, 2, 3, 5, 7, 9, 10],
    'M':  [0, 2, 4, 5, 7, 9, 11],
    'mM': [-1, 2, 3, 5, 7, 9, 0],  // minor-Maj7.  Note we swap root and 7th.
    '7':  [-2, 2, 4, 5, 7, 9, 0]  // Dom7.  Note we swap root and 7th.
  };

  var octaveOffset = 0;
  var adjustedNum = num;

  while (adjustedNum >= 7) {
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
            [3, -5], [3, -3], [3, 0]]],
  [44, -2, [[8, [0, 2]], [8, 4],
           [8, [0, 2]], [8, 4],
           [8, [0, 2]], [8, 4],
           [8, [0, 2]], [8, 4],
          ]],
  [34, -2, [[8, [0, 2]], [8, 4],
           [8, [0, 2]], [8, 4],
           [8, [0, 2]], [8, 4],
          ]],
  [34, -1, [[45, [0, 2, 4]],
           [45, [0, 2, 4]]
          ]],
  [34, -3, [[30, [0, 7]]]],
  [34, 0, [[30, -1]]], // 3/4 rest
  [44, 0, [[1, -1]]], // 4/4 rest
];

/* noteLen:
   4 -> quarter note
   8 -> eighth note
   3 -> triplet note
   1 -> whole
   2 -> half
   45 -> dotted quarter
   30 -> three quarters
*/
function noteLenToMs(tempo, noteLen) {
  var quarter = 60 / tempo * 1000;
  if (noteLen == 4) {
    return quarter;
  } if (noteLen == 8) {
    return quarter / 2;
  } if (noteLen == 1) {
    return quarter * 4;
  } if (noteLen == 45) {
    return quarter *  1.5;
  } if (noteLen == 30) {
    return quarter * 3;
  } if (noteLen == 2) {
    return quarter * 2;
  } if (noteLen == 3) {
    return quarter / 3;
  }
}

/* Convert a note length (1, 2, 4, etc) to an ABC note length, assuming
   the ABC unit is an eighth note. */
function noteLenToABC(noteLen) {
  if (noteLen == 4) {
    return "2";
  } if (noteLen == 8) {
    return "";
  } if (noteLen == 1) {
    return "8";
  } if (noteLen == 45) {
    return "3";
  } if (noteLen == 30) {
    return "6";
  } if (noteLen == 2) {
    return "4";
  } if (noteLen == 3) {
    return "";
  }
}

function Line(timeSig) {
  this.timeSig = timeSig;
  this.notes = [];
  this.patternInstances = [];

  // We remember the notes of each pattern to optimize the next one.
  // This is maintained in sorted order.
  this.prevPatternNotes = [];
}

Score.prototype.play = function(tempo) {
  this.left.play(tempo);
  this.right.play(tempo);
};

Line.prototype.play = function(tempo) {
  var time = 0;
  for (var i = 0; i < this.notes.length; i++) {
    var nums = this.notes[i].nums;
    var len = this.notes[i].len;
    var ms = noteLenToMs(tempo, len);

    for (var j = 0; j < nums.length; j++) {
      if (nums[j] >= 0) {  // -1 is a rest.
        if (nums[j] < 50) {
          velocity = 127;
        } else {
          velocity = 60;
        }

        playNote(nums[j], time, ms, velocity);
      }
    }
    time += ms;
  }
};

/* Optimize newPattern by inverting it until it minimizes the distance
 * against the previously-played (non-empty) pattern. */
Line.prototype.optimizeChord = function(newPattern, note, scaleType) {
  var newNotesSet = {};
  var addedAny = false;

  for (var i = 0; i < newPattern.notes.length; i++) {
    var nums = newPattern.notes[i].nums;

    for (var j = 0; j < nums.length; j++) {
      if (nums[j] != -1) {
        newNotesSet[note + scaleNumToNoteNum(scaleType, nums[j])] = 1;
        addedAny = true;
      }
    }
  }

  var newNotesArray = [];
  for (x in newNotesSet) {
    newNotesArray.push(x);
  }
  newNotesArray.sort();


  // Calculate total difference in this pattern vs last one.
  if (addedAny) {  // Ignore this pattern if empty.
    var diff = 0;
//    if (

    console.log(this.prevPatternNotes, newNotesArray);

    this.prevPatternNotes = newNotesArray;
  }
};

var noteStringToFlat = {
  'C': 'C',
  'C#': 'Db',
  'Db': 'Db',
  'D': 'D',
  'D#': 'Eb',
  'Eb': 'Eb',
  'E': 'E',
  'E#': 'F',
  'Fb': 'E',
  'F': 'F',
  'F#': 'Gb',
  'Gb': 'Gb',
  'G': 'G',
  'G#': 'Ab',
  'Ab': 'Ab',
  'A': 'A',
  'A#': 'Bb',
  'Bb': 'Bb',
  'B': 'B',
  'B#': 'C',
  'Cb': 'B'
};

function noteStringToNum(noteString, octaveOffset) {
  var flatNote = noteStringToFlat[noteString];
  var baseOctave = 5;
  var octave = baseOctave + octaveOffset;
  var finalNoteString = "" + flatNote + octave;
  return MIDI.keyToNote[finalNoteString];
}

/* noteBase is a plain note string (e.g., "C") */
Line.prototype.addPattern = function(repeats, pattern, noteBase, scaleType, octaveOffset) {
  var patternInstance = new PatternInstance(repeats, pattern, noteBase,
                                            scaleType, octaveOffset);

  this.patternInstances.push(patternInstance);

  var note = noteStringToNum(noteBase, pattern.startOctave + octaveOffset);

  // this.optimizeChord(pattern, note, scaleType);  // TODO: enable this.

  for (var r = 0; r < repeats; r++) {
    for (var i = 0; i < pattern.notes.length; i++) {
      var nums = pattern.notes[i].nums;
      var len = pattern.notes[i].len;

      var actualNums = [];
      for (var j = 0; j < nums.length; j++) {
        if (nums[j] == -1) {
          actualNums[j] = -1;  // Rest.
        } else {
          actualNums[j] = note + scaleNumToNoteNum(scaleType, nums[j]);
        }
      }

      //actualNums = invert12(actualNums, 3);

      this.notes.push(new Note(len, actualNums));
    }
  }
};

function midiNoteToABC(note) {
  // This returns "A4", "C5", ...
  var encoded = MIDI.noteToKey[note];

  var octave = parseInt(encoded[encoded.length - 1]);
  var noteStr = encoded.substr(0, encoded.length - 1);

  if (noteStr[1] == 'b') {
    noteStr = noteStr[0] + '_';
  } else if (noteStr[1] == '#') {
    noteStr = noteStr[0] + '^';
  }

  if (octave == 5) {
    noteStr = noteStr.toLowerCase();
  } else if (octave > 5) {
    noteStr = noteStr.toLowerCase();
    for (var i = 5; i < octave; i++) {
      noteStr += "'";
    }
  } else {
    for (var i = 3; i >= octave; i--) {
      noteStr += ",";
    }
  }
  return noteStr;
}

Line.prototype.toABC = function() {
  var abc = "";
  var s = [];

  var isFirstNote = true;
  var beats = 0;  // Number of beats so far.
  var timeInMs = 0;  // Time, up to one measure.
  var timeTotalInMs = 0;
  for (var i = 0; i < this.notes.length; i++) {
    if (timeTotalInMs > 20000) {
      break;
    }

    var nums = this.notes[i].nums;
    var len = this.notes[i].len;

    if (parseInt(timeInMs) == 1000) {
      timeInMs = 0;
      beats++;
    } else if (parseInt(timeInMs) == 2000) {
      timeInMs = 0;
      beats += 2;
    } else if (parseInt(timeInMs) == 3000) {
      timeInMs = 0;
      beats += 3;
    } else if (parseInt(timeInMs) == 4000) {
      timeInMs = 0;
      beats += 4;
    } else if (parseInt(timeInMs) == 5000) {
      timeInMs = 0;
      beats += 5;
    } else if (parseInt(timeInMs) == 6000) {
      timeInMs = 0;
      beats += 6;
    }


    if (timeInMs == 0) {
      // Start bar?
      if (!isFirstNote) {
        if (this.timeSig == 34 && (beats % 3) == 0) {
          s.push('|');
        } else if (this.timeSig == 34 && (beats % 3) == 0) {
          s.push('|');
        }
      }

      s.push(' ');  // Start a new bracket.
    }

    timeInMs += noteLenToMs(60, len);
    timeTotalInMs += noteLenToMs(60, len);

    if (nums.length > 1) {
      s.push('[');
    }
    for (var j = 0; j < nums.length; j++) {
      if (nums[j] >= 0) {
        abcNote = midiNoteToABC(nums[j]);
      } else {
        // Rest.
        abcNote = 'z';
      }
      s.push(abcNote + noteLenToABC(len));
      isFirstNote = false;
    }
    if (nums.length > 1) {
      s.push(']');
    }
  }
  s.push('|');

  abc += s.join("");

  return abc;
};

function playNote(note, time, len, velocity) {
  setTimeout(function() {
    MIDI.noteOn(0, note, velocity, 0);
    var decay = 1;
    MIDI.noteOff(0, note, velocity, decay);  // TODO: How does noteOff() actually work?
  }, time);
}

/* notes is an array of note numbers.
 * direction is positive or negative number of inversions. */
function invert12(notes, direction) {
  if (notes.length == 0) {
    return notes;
  }

  if (notes.length == 1 && notes[0] == -1) {
    // This is a rest.
    return notes;
  }

  if (direction > 0) {
    for (var i = 0; i < direction; i++) {
      notes[i % notes.length] += 12;
    }
  } else if (direction < 0) {
    for (var i = 0; i < -direction; i++) {
      notes[(notes.length*10 - 1 - i) % notes.length] -= 12;  // 10 is arbitrary.
    }
  }
  return notes;
}

Line.prototype.render = function($div) {
  
};

Score.prototype.addRepeat = function(repeats) {
};

Score.prototype.render = function($div) {
  // We assume left and right have same number of patterns.
  var html = this.left.patternInstances.length + " " + this.right.patternInstances.length + "<BR>\n";

  for (var i = 0; i < this.left.patternInstances.length; i++) {
    for (var j = 0; j < this.left.patternInstances[i].repeats; j++) {
      html += this.left.patternInstances[i].noteBase + " " + this.right.patternInstances[i].noteBase + "<BR>\n";
    }
  }

  $div.html(html);
};

Pattern.prototype.render = function() {
};

