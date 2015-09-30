var muted = false;

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

  this.leftSeq = new Sequence(1);
  this.rightSeq = new Sequence(1);
  this.multiSeq = new MultiChannelSequence(this.leftSeq, this.rightSeq);
}

Score.prototype.play = function(tempo, $scoreTable) {
  stopAll();

  $scoreTable.find("td").html('');
  this.renderIntoTable($scoreTable);

  var leftNoteStream = this.leftSeq.generateNoteStream();
  var rightNoteStream = this.rightSeq.generateNoteStream();

  // Wait a bit before playing, to give render time to complete.
  var timeout = setTimeout(function() {
    leftNoteStream.play(tempo);
    rightNoteStream.play(tempo);
  }, 600);
  allTimeouts.push(timeout);

  currentlyPlaying = this;
};

function Pattern() {
  this.timeSig = 0;
  this.startOctave = 0;
  this.notes = [];
}

function NoteStream() {
  this.notes = [];
  this.currentPatternId = '';
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

/* options is a dict that can contain:
   - octaveOffset: int
   - pinVoicing: bool  - if true, do not optimize the chord inversion
*/
function PatternInstance(repeats, pattern, noteBase, scaleType, options) {
  options = options || {};

  this.repeats = repeats;
  this.pattern = pattern;
  this.noteBase = noteBase;
  this.scaleType = scaleType;
  this.octaveOffset = options.octaveOffset || 0;
  this.pinVoicing = options.pinVoicing || false;

  // A mapping of notes, for inversions.  Key: orig note num.  Val: new note num.
  this.noteMap = null;

  this.id = 'p' + ('' + Math.random()).substring(2);

  this.noteSet = this.gatherNoteSet();
}

PatternInstance.prototype.generateNoteStream = function(doRepeats) {
  var note = noteStringToNum(this.noteBase, this.pattern.startOctave + this.octaveOffset);

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

          // Apply noteMap (inversion mapping).
          if (this.noteMap && (actualNums[j] in this.noteMap)) {
            actualNums[j] = this.noteMap[actualNums[j]];
          }
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
    '7':  [-2, 2, 4, 5, 7, 9, 0],  // Dom7.  Note we swap root and 7th.
    'M7':  [-1, 2, 4, 5, 7, 9, 0],  // Maj7.  Note we swap root and 7th.
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
  } else if (noteLen == 8) {
    return quarter / 2;
  } else if (noteLen == 1) {
    return quarter * 4;
  } else if (noteLen == 45) {
    return quarter *  1.5;
  } else if (noteLen == 30) {
    return quarter * 3;
  } else if (noteLen == 2) {
    return quarter * 2;
  } else if (noteLen == 3) {
    return quarter / 3;
  } else if (noteLen == 6) {
    return quarter / 6;
  }
}

/* Convert a note length (1, 2, 4, etc) to an ABC note length, assuming
   the ABC unit is an eighth note. */
function noteLenToABC(abcNote, noteLen) {
  if (noteLen == 4) {
    return abcNote + '2';
  } else if (noteLen == 8) {
    return abcNote;
  } else if (noteLen == 1) {
    return abcNote + '8';
  } else if (noteLen == 45) {
    return abcNote + '3';
  } else if (noteLen == 30) {
    return abcNote + '6';
  } else if (noteLen == 2) {
    return abcNote + '4';
  } else if (noteLen == 3) {
    return '(3' + abcNote;
  } else if (noteLen == 5) {
    return '(5' + abcNote;
  } else if (noteLen == 6) {
    return '(6' + abcNote;
  } else if (noteLen == 7) {
    return '(7' + abcNote;
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
Sequence.prototype.addPattern = function(repeats, pattern, noteBase, scaleType, options, callback) {
  var patternInstance = new PatternInstance(repeats, pattern, noteBase, scaleType, options);
  var item = new SequenceItem(PATTERN_INSTANCE, patternInstance);

  var numItems = this.items.length;
  if (numItems > 0 && this.items[numItems - 1].type == PATTERN_INSTANCE) {
    var previousPatternInstance = this.items[numItems - 1].item;
    if (!patternInstance.pinVoicing) {
      patternInstance.noteMap = calculateBestInversion(previousPatternInstance.noteSet,
                                                       patternInstance.noteSet);
    }
  }

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

/* Calculate the inversion of noteSet2 which most closely matches noteSet1.
   Returns a note mapping (hash of int->int). */
function calculateBestInversion(noteSet1, noteSet2) {
  var bestDiff = 9999;
  var bestInversion = 0;
  var finalNoteSet = null;

  if ((noteSet1.length == 1 && noteSet1[0] == -1) ||
      (noteSet2.length == 1 && noteSet2[0] == -1)) {
    // One of them is just silence.
    return {};
  }

  // Try several inversions.  Keep the best.
  for (var inversion = -2; inversion <= 2; inversion++) {
    // Invert the second noteset.
    var inverted = invertNotes(noteSet2, inversion);
    var diff = calculateNoteSetDifference(noteSet1, inverted, 0);

    if (diff < bestDiff) {
      bestInversion = inversion;  // Just used for debugging output.
      finalNoteSet = inverted;
      bestDiff = diff;
    }
  }

  // Remaping info for p.generateNoteStream().
  var noteMap = {};
  for (var i = 0; i < Math.min(noteSet1.length, noteSet2.length); i++) {
    noteMap[noteSet2[i]] = finalNoteSet[i];
  }

  return noteMap;
}

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
                                                     scaleType, options) {
  if (patternLeft) {
    this.leftSeq.addPattern(repeats, patternLeft, noteBase, scaleType, options, null);
  }
  if (patternRight) {
    this.rightSeq.addPattern(repeats, patternRight, noteBase, scaleType, options, null);
  }
};

Sequence.prototype.renderIntoDiv = function($div) {
  var $sub = $('<div>').css('border-left', '1px solid silver').css('padding', '8px').css('margin', '8px');
  $div.append($sub);
  $sub.append($('<div>').text('x' + this.repeats).css('font-style', 'italic'));
  for (var i = 0; i < this.items.length; i++) {
    var item = this.items[i];
    if (item.type == PATTERN_INSTANCE) {
      var patternInstance = item.item;

      if (patternInstance.noteSet.length == 1 && patternInstance.noteSet[0] == -1) {
        // This is just silence, so don't render it.
        continue;
      }

      var $notationParent = $('<div>').css('height', '80px').css('width', '300px').
        attr('id', patternInstance.id).addClass('patternInstance').attr('seq', i);
      var $notation = $('<div>');
      $notationParent.append($notation);
      $sub.append($notationParent);

      var header = 'M:none\n%%staves P1\nV:P1' ;// name=\'x' + patternInstance.repeats + '\"";

      // Decide whether to display in bass clef.
      if (patternInstance.noteSet[0] <= 55 /* low G */ ||
          patternInstance.noteSet[patternInstance.noteSet.length - 1] < 60 /* mid C */) {
        header += ' clef=bass ';
      }
      header += '\n';
      var abc = header + patternInstance.toABC();

      var engraverParams = {
        'scale': .8,
        'staffwidth': 300,
        'paddingtop': -20,
        'paddingbottom': 0,
        'paddingleft': 0,
        'paddingright': 0
      };
      ABCJS.renderAbc($notation.get(0), abc, null, engraverParams);
      $sub.append($('<div>').text(patternInstance.octaveStart));

    } else if (item.type == SEQUENCE) {
      item.item.renderIntoDiv($sub);
    }
  }
};

Score.prototype.renderIntoTable = function($table) {
  var $leftDiv = $('<div>').attr('id', 'left_column').css('margin', '8px').css('padding', '8px');
  var $rightDiv = $('<div>').attr('id', 'right_column').css('margin', '8px').css('padding', '8px');

  this.leftSeq.renderIntoDiv($leftDiv);
  this.rightSeq.renderIntoDiv($rightDiv);

  $table.find("#left_column_cell").append($leftDiv);
  $table.find("#right_column_cell").append($rightDiv);

  var resize = function() {
    var top = $leftDiv.position().top;
    var newHeight = ($(window).height() - top - 48) + 'px';
    $leftDiv.css('height', newHeight);
    $rightDiv.css('height', newHeight);
  }

  $(window).resize(resize);
  resize();
};

Sequence.prototype.generateNoteStream = function() {
  var noteStream = new NoteStream();
  this.traverse(function(p /* patternInstance */) {
    var s = p.generateNoteStream(true);
    noteStream.notes = noteStream.notes.concat(s.notes);
  });
  return noteStream;
};

function invertNotes(noteSet, inversion) {
  var newNoteSet = noteSet.slice();  // Make copy.
  if (inversion > 0) {
    for (var i = 0; i < inversion; i++) {
      var first = newNoteSet.shift();
      first += 12;
      newNoteSet = newNoteSet.concat(first);
    }
  } else if (inversion < 0) {
    for (var i = 0; i < -inversion; i++) {
      var last = newNoteSet.pop();
      last -= 12;
      newNoteSet = [last].concat(newNoteSet);
    }
  }
  return newNoteSet;
}

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
  var finalNoteString = '' + flatNote + octave;
  return MIDI.keyToNote[finalNoteString];
}

function midiNoteToABC(note) {
  // This returns 'A4', 'C5', ...
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

  var abc = '';
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
      s.push(noteLenToABC(abcNote, len));
      isFirstNote = false;
    }
    if (nums.length > 1) {
      s.push(']');
    }
  }
  s.push('|');

  abc += s.join('');

  return abc;
};

/* Returns an array which is the set of all notes in this pattern instance.  That is,
   chords are expanded to individual notes, and notes appearing multiple times show up just
   once here.  The array is sorted in ascending order.*/
PatternInstance.prototype.gatherNoteSet = function() {
  var noteStream = this.generateNoteStream(false);
  var noteNumSet = {};

  for (var i = 0; i < noteStream.notes.length; i++) {
    for (var j = 0; j < noteStream.notes[i].nums.length; j++) {  // Expand chords.
      noteNumSet[noteStream.notes[i].nums[j]] = 1;
    }
  }

  var sortedNotes = [];
  for (noteNum in noteNumSet) {
    // noteNum is here a string, because it's a Object key.
    sortedNotes.push(parseInt(noteNum));
  }
  sortedNotes.sort();
  return sortedNotes;
};

/* Calculate a distance metric between two note sets, which
   are arrays of note numbers, sorted ascending.
   Choose from two methods:
     0 : the sum of the min diff from each note in set1 to
         any note in set2
     1 : the sum of distances {abs(set1[0]-set2[0]), then set[1] etc}
*/
function calculateNoteSetDifference(set1, set2, method) {
  if (method == 0) {
    var sum = 0;
    for (var j = 0; j < set2.length; j++) {
      var min = 9999;
      for (var i = 0; i < set1.length; i++) {
        var diff = Math.abs(set1[i] - set2[j]);
        if (diff < min) {
          min = diff;
        }
      }
      sum += min;
    }
    return sum;
  } else if (method == 1) {
    var sum = 0;
    var min_length = Math.min(set1.length, set2.length);
    for (var i = 0; i < min_length; i++) {
      var diff = Math.abs(set1[i] - set2[i]);
      sum += diff;
    }
    return sum;
  }
}

function testCalculateNoteSetDifference() {
  a = [0, 10, 20];
  b = [5, 10, 20];
  c = [10, 20, 30];
  d = [5, 15, 25];

  console.log(calculateNoteSetDifference(a, b, 0));
  console.log(calculateNoteSetDifference(a, b, 1));
  console.log(calculateNoteSetDifference(a, c, 0));
  console.log(calculateNoteSetDifference(a, c, 1));
  console.log(calculateNoteSetDifference(a, d, 0));
  console.log(calculateNoteSetDifference(a, d, 1));

  console.log(calculateNoteSetDifference(b, c, 0));
  console.log(calculateNoteSetDifference(b, c, 1));
  console.log(calculateNoteSetDifference(b, d, 0));
  console.log(calculateNoteSetDifference(b, d, 1));

  console.log(calculateNoteSetDifference(c, d, 0));
  console.log(calculateNoteSetDifference(c, d, 1));
}

// Delay the timeouts by a constant time to allow initial setup to complete.
// TODO: is this helpful?
var DELAY_START_OFFSET = 100;
var lastLeftPatternId = '';
var lastRightPatternId = '';

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
      if (!muted) {
        MIDI.noteOn(0, note, velocity, 0);
      }
    }

    if (patternId != noteStream.currentPatternId) {
      if (noteStream.currentPatternId != '') {
        // Hide old highlight.
        $('#' + noteStream.currentPatternId).css('border-left', '1px solid white');
        $('#' + noteStream.currentPatternId).css('background-color', 'white');
      }
      // Highlight new.
      var highlightId = '#' + patternId;
      $(highlightId).css('border-left', '1px solid white');
      $(highlightId).css('background-color', '#B2C6E0'); //'#f0f0ff');
      $(highlightId).get(0).scrollIntoView({behavior:'smooth'});

      noteStream.currentPatternId = patternId;
    }

    if (note >= 0) {
      var timeout = setTimeout(function() {
        if (!muted) {
          MIDI.noteOff(0, note, 30, 0);
        }
      }, Math.max(0, len));
      allTimeouts.push(timeout);
    }
  }, time + DELAY_START_OFFSET);
  allTimeouts.push(timeout);
}

// ERASE THIS
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

/*
function resizeScore() {
  var top = $("#score").position().top;
  var newHeight = ($(window).height() - top - 8) + 'px';
  $('#left_column').css('height', newHeight);
  $('#right_column').css('height', newHeight);

  console.log($(window).height(), top, newHeight);
}

$(window).resize(function() {
  resizeScore();
});

$(function() {
  setTimeout(resizeScore, 0);
});
*/
