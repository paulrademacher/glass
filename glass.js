// TODO: Delete Line object.  It's replaced by Sequence.

function Note(len, nums, patternInstanceId) {
  this.len = len;

  if (typeof nums == 'number') {
    nums = [nums];
  }
  this.nums = nums;

  this.patternInstanceId = patternInstanceId;
}

function Score(timeSig) {
  this.timeSig = timeSig;
  this.left = new Line(timeSig);
  this.right = new Line(timeSig);

  this.leftSeq = new Sequence(1);
  this.rightSeq = new Sequence(1);
  this.multiSeq = new MultiChannelSequence(this.leftSeq, this.rightSeq);
}

Score.prototype.play = function(tempo, $scoreDiv) {
  stopAll();

  $scoreDiv.html("");
  this.renderIntoDiv($scoreDiv);

  var leftNoteStream = this.leftSeq.generateNoteStream();
  var rightNoteStream = this.rightSeq.generateNoteStream();

  // Wait a bit before playing, to give render time to complete.
  setTimeout(function() {
    leftNoteStream.play(tempo);
    rightNoteStream.play(tempo);
  }, 600);

  currentlyPlaying = this;
};

function Pattern() {
  this.timeSig = 0;
  this.startOctave = 0;
  this.notes = [];
}

function NoteStream() {
  this.notes = [];
  this.currentPatternId = "";
}

NoteStream.prototype.push = function(x) {
  this.notes.push(x);
}

NoteStream.prototype.play = function(tempo) {
  var time = 0;
  for (var i = 0; i < this.notes.length; i++) {
    var nums = this.notes[i].nums;
    var len = this.notes[i].len;
    var ms = noteLenToMs(tempo, len);

    for (var j = 0; j < nums.length; j++) {
      if (nums[j] < 50) {
        velocity = 127;
      } else {
        velocity = 60;
      }

      playNote(nums[j], time, ms, velocity, this,
               this.notes[i].patternInstanceId);
    }
    time += ms;
  }
};

function PatternInstance(repeats, pattern, noteBase, scaleType, octaveOffset) {
  this.repeats = repeats;
  this.pattern = pattern;
  this.noteBase = noteBase;
  this.scaleType = scaleType;
  this.octaveOffset = octaveOffset;
  this.id = "p" + ("" + Math.random()).substring(2);
}

PatternInstance.prototype.generateNoteStream = function(doRepeats) {
  var note = noteStringToNum(this.noteBase, this.pattern.startOctave + this.octaveOffset);

  // this.optimizeChord(pattern, note, scaleType);  // TODO: enable this.

  var noteStream = new NoteStream();

  var repeats = doRepeats ? this.repeats : 1;

  for (var r = 0; r < repeats; r++) {
    for (var i = 0; i < this.pattern.notes.length; i++) {
      var nums = this.pattern.notes[i].nums;
      var len = this.pattern.notes[i].len;

      var actualNums = [];
      for (var j = 0; j < nums.length; j++) {
        if (nums[j] == -1) {
          actualNums[j] = -1;  // Rest.
        } else {
          actualNums[j] = note + scaleNumToNoteNum(this.scaleType, nums[j]);
        }
      }
      noteStream.push(new Note(len, actualNums, this.id));
    }
  }
  return noteStream;
};

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

var SEQUENCE = 'seq';
var PATTERN_INSTANCE = 'pat';

/* A SequenceItem can be a Sequence or a pattern. */
function SequenceItem(type, item) {
  this.type = type;
  this.item = item;
}

function Sequence(repeats) {
  this.repeats = repeats;
  this.items = [];
}

// Callback is optional.  Will be called with new PatternInstance.
Sequence.prototype.addPattern = function(repeats, pattern, noteBase, scaleType, octaveOffset, callback) {
  var patternInstance = new PatternInstance(repeats, pattern, noteBase, scaleType, octaveOffset);
  var item = new SequenceItem(PATTERN_INSTANCE, patternInstance);
  this.items.push(item);
  if (callback) {
    callback(patternInstance);
  }
  return patternInstance;
};

// Callback is optional.  Will be called with new Sequence.
Sequence.prototype.addSequence = function(repeats, callback) {
  var sequence = new Sequence(repeats);
  var item = new SequenceItem(SEQUENCE, sequence);
  this.items.push(item);
  if (callback) {
    callback(sequence);
  }
  return sequence;
};

function MultiChannelSequence(leftSeq, rightSeq) {
  this.leftSeq = leftSeq;
  this.rightSeq = rightSeq;
}

MultiChannelSequence.prototype.addSequence = function(repeats, callback) {
  var newLeftSeq = this.leftSeq.addSequence(repeats, null);
  var newRightSeq = this.rightSeq.addSequence(repeats, null);
  var newMultiSeq = new MultiChannelSequence(newLeftSeq, newRightSeq);
  if (callback) {
    callback(newMultiSeq);
  }
};

MultiChannelSequence.prototype.addPattern = function(repeats, patternLeft, patternRight, noteBase,
                                                     scaleType, octaveOffset) {
  if (patternLeft) {
    this.leftSeq.addPattern(repeats, patternLeft, noteBase, scaleType, octaveOffset, null);
  }
  if (patternRight) {
    this.rightSeq.addPattern(repeats, patternRight, noteBase, scaleType, octaveOffset, null);
  }
};

Sequence.prototype.renderIntoDiv = function($div) {
  var $sub = $("<div>").css("border", "1px solid silver").css("padding", "8px").css("margin", "8px");
  $div.append($sub);
  $sub.append($("<div>").text("x" + this.repeats).css("font-style", "italic"));
  for (var i = 0; i < this.items.length; i++) {
    var item = this.items[i];
    if (item.type == PATTERN_INSTANCE) {
      var patternInstance = item.item;
      var $notationParent = $("<div>").css("height", "80px").css("width", "300px").
        attr("id", patternInstance.id).addClass("patternInstance");
      var $notation = $("<div>");
      $notationParent.append($notation);
      $sub.append($notationParent);

      var header = "%%staves P1\nV:P1 name=\"x" + patternInstance.repeats + "\"";
      if (patternInstance.pattern.startOctave < -1) {
        header += " clef=bass ";
      }
      header += "\n";
      var abc = header + patternInstance.toABC();

      var engraverParams = {
        "scale": .8,
        "staffwidth": 300,
        "paddingtop": -20,
        "paddingbottom": 0,
        "paddingleft": 0,
        "paddingright": 0
      };
      ABCJS.renderAbc($notation.get(0), abc, null, engraverParams);
      $sub.append($("<div>").text(patternInstance.octaveStart));

    } else if (item.type == SEQUENCE) {
      item.item.renderIntoDiv($sub);
    }
  }
};

Score.prototype.renderIntoDiv = function($div) {
  var $leftDiv = $("<div>").attr("id", "leftNotation").
    css("border", "1px solid silver").css("margin", "8px").css("padding", "8px").text("Left");
  var $rightDiv = $("<div>").attr("id", "rightNotation").
    css("border", "1px solid silver").css("margin", "8px").css("padding", "8px").text("Right");

  this.leftSeq.renderIntoDiv($leftDiv);
  this.rightSeq.renderIntoDiv($rightDiv);

  $div.append($leftDiv);
  $div.append($rightDiv);
};

Sequence.prototype.generateNoteStream = function() {
  var time = {'t': 0};
  var noteStream = new NoteStream();
  this.traverse(function(p /* patternInstance */) {
    var s = p.generateNoteStream(true);
    noteStream.notes = noteStream.notes.concat(s.notes);
  });
  return noteStream;
};

Sequence.prototype.traverse = function(callback) {
  this.traverseInternal(callback);
};

// Do not call this directly.  Internal recusion function.
Sequence.prototype.traverseInternal = function(callback) {
  for (var j = 0; j < this.repeats; j++) {
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].type == SEQUENCE) {
        this.items[i].item.traverseInternal(callback);
      } else if (this.items[i].type == PATTERN_INSTANCE) {
        callback(this.items[i].item);
      }
    }
  }
};

function Line(timeSig) {
  this.timeSig = timeSig;
  this.notes = [];
  this.patternInstances = [];

  // We remember the notes of each pattern to optimize the next one.
  // This is maintained in sorted order.
  this.prevPatternNotes = [];
}

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
  // TODO: eraseme
};

function midiNoteToABC(note) {
  // This returns "A4", "C5", ...
  var encoded = MIDI.noteToKey[note];

  var octave = parseInt(encoded[encoded.length - 1]);
  var noteStr = encoded.substr(0, encoded.length - 1);

  if (noteStr[1] == 'b') {
    noteStr = '_' + noteStr[0];
  } else if (noteStr[1] == '#') {
    noteStr = '^' + noteStr[0];
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

PatternInstance.prototype.toABC = function() {
  var noteStream = this.generateNoteStream(false);

  var abc = "";
  var s = [];

  var isFirstNote = true;
  var beats = 0;  // Number of beats so far.
  var timeInMs = 0;  // Time, up to one measure.
  var timeTotalInMs = 0;

  var notes = noteStream.notes;

  for (var i = 0; i < notes.length; i++) {
    var nums = notes[i].nums;
    var len = notes[i].len;

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

// Delay the timeouts by a constant time to allow initial setup to complete.
// TODO: is this helpful?
var DELAY_START_OFFSET = 100;
var lastLeftPatternId = "";
var lastRightPatternId = "";

// All setTimeout() handles.
var allTimeouts = [];

function stopAll() {
  for (var i = 0; i < allTimeouts.length; i++) {
    clearTimeout(allTimeouts[i]);
  }
  allTimeouts = [];
}

/* hand is 0:left or 1:right */
function playNote(note, time, len, velocity, noteStream, patternId) {
  var timeout = setTimeout(function() {
    if (note >= 0) {
      // note=-1 is a rest.  But we still want to invoke this function to get the
      // css highlight below.
      MIDI.noteOn(0, note, velocity, 0);
    }

    if (patternId != noteStream.currentPatternId) {
      if (noteStream.currentPatternId != "") {
        // Hide old highlight.
        $("#" + noteStream.currentPatternId).css("border", "1px solid white");
        $("#" + noteStream.currentPatternId).css("background-color", "white");
      }
      // Highlight new.
      var highlightId = "#" + patternId;
      $(highlightId).css("border", "1px solid blue");
      $(highlightId).css("background-color", "#fcfcff");
      $(highlightId).scrollintoview();

      noteStream.currentPatternId = patternId;
    }

    if (note >= 0) {
      var timeout = setTimeout(function() {
        MIDI.noteOff(0, note, 30, 0);
      }, Math.max(0, len));
      allTimeouts.push(timeout);
    }
  }, time + DELAY_START_OFFSET);
  allTimeouts.push(timeout);
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

