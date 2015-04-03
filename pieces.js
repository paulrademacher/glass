var patternsRaw = [
  [44, -1, [[3, -3], [3, 0], [3, 2],
            [3, -3], [3, 0], [3, 2],
            [3, -3], [3, 0], [3, 2],
            [3, -3], [3, 0], [3, 2]]],
  [44, 0, [[8, 0], [8, 2], [8, 0], [8, 2], [8, 0], [8, 2], [8, 0], [8, 2]]],

/* pattern3 - 4/4 whole note */
  [44, -2, [[1, 0]]],
  [44, -1, [[3, -5], [3, -3], [3, 0],
            [3, -5], [3, -3], [3, 0],
            [3, -5], [3, -3], [3, 0],
            [3, -5], [3, -3], [3, 0]]],
  [44, -2, [[8, [0, 2]], [8, 4],
           [8, [0, 2]], [8, 4],
           [8, [0, 2]], [8, 4],
           [8, [0, 2]], [8, 4]]],
  [34, -2, [[8, [0, 2]], [8, 4],
           [8, [0, 2]], [8, 4],
           [8, [0, 2]], [8, 4]]],
  [34, -1, [[45, [0, 2, 4]],
           [45, [0, 2, 4]]]],
  [34, -3, [[30, [0, 7]]]],
  [34, 0, [[30, -1]]], // 3/4 rest
  [44, 0, [[1, -1]]], // 4/4 rest

/* pattern11 */
  [34, -1, [[45, [2, 4, 7]],
            [45, [2, 4, 7]]
           ]],

/* pattern12 - etude12 LH beginning */
  [44, -1, [[8, 0], [8, 7], [8, [2, 4]], [8, 7]]],

/* pattern13 - etude12 RH beginning */
  [34, 0, [[8, 2], [8, 4], [8, 7]]],

/* pattern14 - etude12 LH beginning - inverted */
  [44, -1, [[8, -5], [8, 2], [8, [-3, 0]], [8, 2]]],

/* pattern15 - etude12 RH beginning - inverted */
  [34, 0, [[8, -3], [8, 0], [8, 2]]],

/* pattern16 */
  [44, -2, [[8, [0, 2]], [8, 4],
           [8, 2], [8, 4],
           [8, 2], [8, 4],
           [8, 2], [8, 4]]],

/* pattern17 - Mad Rush flutter */
  [44, -1, [[3, 4], [3, 2], [3, 4],
           [3, 2], [3, 4], [3, 2],
           [3, 4], [3, 2], [3, 4],
           [3, 2], [3, 4], [3, 2]
          ]],

/* pattern18 - Mad Rush flutter 2 */
  [44, -1, [[3, 2], [3, -3], [3, 2],
           [3, -3], [3, 2], [3, -3],
           [3, 2], [3, -3], [3, 2],
           [3, -3], [3, 2], [3, -3]
          ]],

/* pattern19 - Mad Rush flutter */ // TODO: Not needed after invert optimization.
  [44, -1, [[3, 2], [3, 0], [3, 2],
           [3, 0], [3, 2], [3, 0],
           [3, 2], [3, 0], [3, 2],
           [3, 0], [3, 2], [3, 0]
          ]],

/* pattern20 - Mad Rush flutter */ // TODO: Not needed after invert optimization.
  [44, -1, [[3, 4], [3, 0], [3, 4],
           [3, 0], [3, 4], [3, 0],
           [3, 4], [3, 0], [3, 4],
           [3, 0], [3, 4], [3, 0]
          ]],

/* pattern21 - half note silence */
  [44, 0, [[2, -1]]],

/* pattern22 - 6-tuplet arpeggio up */
  [44, -1, [[6, 2], [6, 4], [6, 6], [6, 7], [6, 4], [6, 2]]],

/* pattern23 - 6-tuplet arpeggio down */
  [44, -2, [[6, 7], [6, 4], [6, 2], [6, 0], [6, 2], [6, 4]]]
];


var pattern1 = deserializePattern(patternsRaw[0]);
var pattern2 = deserializePattern(patternsRaw[1]);
var pattern3 = deserializePattern(patternsRaw[2]);
var pattern4 = deserializePattern(patternsRaw[3]);
var pattern5 = deserializePattern(patternsRaw[4]);
var pattern6 = deserializePattern(patternsRaw[5]);
var pattern7 = deserializePattern(patternsRaw[6]);
var pattern8 = deserializePattern(patternsRaw[7]);
var pattern9 = deserializePattern(patternsRaw[8]);
var pattern10 = deserializePattern(patternsRaw[9]);
var pattern11 = deserializePattern(patternsRaw[10]);
var pattern12 = deserializePattern(patternsRaw[11]);
var pattern13 = deserializePattern(patternsRaw[12]);
var pattern14 = deserializePattern(patternsRaw[13]);
var pattern15 = deserializePattern(patternsRaw[14]);
var pattern16 = deserializePattern(patternsRaw[15]);
var pattern17 = deserializePattern(patternsRaw[16]);
var pattern18 = deserializePattern(patternsRaw[17]);
var pattern19 = deserializePattern(patternsRaw[18]);
var pattern20 = deserializePattern(patternsRaw[19]);
var pattern21 = deserializePattern(patternsRaw[20]);
var pattern22 = deserializePattern(patternsRaw[21]);
var pattern23 = deserializePattern(patternsRaw[22]);

var whole44 = pattern3;
var silence34 = pattern9;
var silence44 = pattern10;
var silencehalf = pattern21;

/*          pattern6 = pattern5;
          pattern7 = pattern1;
          pattern8 = pattern3;
          silence34 = silence44;
*/

function playPieces() {
  playEtude12()
}

function playMetamorphosisThree() {
  var score = new Score(34);

  score.multiSeq.addSequence(2, function(seq) {
    seq.addSequence(1, function(seq) {
      seq.addPattern(4, pattern6, silence34, "D", "m");
      seq.addPattern(1, pattern6, pattern8, "D", "m");  // Bass crossover.
      seq.addPattern(3, pattern6, silence34, "D", "m");
    });
    seq.addPattern(2, pattern6, pattern7, "D", "m");
    seq.addPattern(2, pattern6, pattern7, "D", "mM");
    seq.addPattern(2, pattern6, pattern7, "G", "m");
    seq.addPattern(2, pattern6, pattern7, "Eb", "M");
    seq.addPattern(2, pattern6, pattern7, "C", "M");
    seq.addPattern(2, pattern6, pattern7, "A", "M");

    seq.addSequence(1, function(seq) {
      seq.addPattern(4, pattern6, silence34, "D", "m");
      seq.addPattern(1, pattern6, pattern8, "D", "m");  // Bass crossover.
      seq.addPattern(3, pattern6, silence34, "D", "m");
    });

    seq.addSequence(2, function(seq) {
      seq.addPattern(2, pattern6, pattern11, "D", "M");
      seq.addPattern(1, pattern6, pattern7, "F#", "M");
      seq.addPattern(1, pattern6, pattern7, "F#", "7");
      seq.addPattern(4, pattern6, pattern11, "D", "M");
    });
  });

  score.play(160, $("#score"));
}

function playEtude12() {
  var score = new Score(34);

  score.leftSeq.addPattern(8, pattern12, "D", "m", {'octaveOffset': -1});
  score.rightSeq.addPattern(4, silence44, "D", "m", {'octaveOffset': -1});

  score.multiSeq.addSequence(2, function(seq) {
    seq.leftSeq.addPattern(6, pattern12, "D", "m", {'octaveOffset': -1});
    seq.rightSeq.addPattern(8, pattern13, "D", "m", {'octaveOffset': -1});
  });

  score.multiSeq.addSequence(2, function(seq) {
    seq.leftSeq.addPattern(6, pattern14, "Bb", "M", {'octaveOffset': -1});
    seq.rightSeq.addPattern(8, pattern15, "Bb", "M", {'octaveOffset': -1});
    seq.leftSeq.addPattern(6, pattern12, "D", "m", {'octaveOffset': -1});
    seq.rightSeq.addPattern(8, pattern13, "D", "m", {'octaveOffset': -1});
  });

  score.leftSeq.addPattern(6, pattern14, "Bb", "M", {'octaveOffset': -1});
  score.rightSeq.addPattern(8, pattern15, "Bb", "M", {'octaveOffset': -1});

  score.multiSeq.addSequence(2, function(seq) {
    seq.leftSeq.addPattern(6, pattern12, "D", "m", {'octaveOffset': -1});
    seq.rightSeq.addPattern(8, pattern13, "D", "m", {'octaveOffset': -1});
  });

  score.multiSeq.addSequence(2, function(seq) {
    seq.leftSeq.addPattern(6, pattern14, "A", "M", {'octaveOffset': -1});
    seq.rightSeq.addPattern(8, pattern15, "A", "M", {'octaveOffset': -1});
    seq.leftSeq.addPattern(3, pattern12, "D", "m", {'octaveOffset': -1});
    seq.rightSeq.addPattern(4, pattern13, "D", "m", {'octaveOffset': -1});
    seq.leftSeq.addPattern(3, pattern12, "D", "M", {'octaveOffset': -1});
    seq.rightSeq.addPattern(4, pattern13, "D", "M", {'octaveOffset': -1});
  });

  score.play(170, $("#score"));
}

function playMadRush() {
  var score = new Score(44);

  function intro() {
    score.leftSeq.addPattern(2, pattern16, "F", "M");
    score.rightSeq.addPattern(2, silence44, "F", "M");
    score.leftSeq.addPattern(2, pattern16, "A", "m");
    score.rightSeq.addPattern(1, whole44, "C", "M", {'octaveOffset': -1});
    score.rightSeq.addPattern(1, silence44, "F", "M");
  }

  function theme1() {
    score.multiSeq.addSequence(2, function(seq) {
      seq.leftSeq.addPattern(2, pattern16, "F", "M");
      seq.leftSeq.addPattern(2, pattern16, "A", "m");
      seq.rightSeq.addPattern(2, pattern17, "F", "M");
      seq.rightSeq.addPattern(2, pattern18, "A", "m", {'pinVoicing': true});
    });
  }

  function theme2() {
    score.multiSeq.addSequence(2, function(seq) {
      seq.leftSeq.addPattern(2, pattern16, "G", "m");
      seq.rightSeq.addPattern(1, pattern19, "G", "m");
      seq.rightSeq.addPattern(1, pattern20, "G", "m");

      seq.leftSeq.addPattern(2, pattern16, "F", "M");
      seq.rightSeq.addPattern(2, pattern17, "F", "M");
    });
  }

  function segue() {
    score.leftSeq.addPattern(2, pattern16, "F", "M");
    score.rightSeq.addPattern(2, silence44, "F", "M");
    score.leftSeq.addPattern(2, pattern16, "A", "m", {'pinVoicing': true});
    score.rightSeq.addPattern(1, whole44, "A", "M");
    score.rightSeq.addPattern(1, silence44, "F", "M");
  }

  function arpeggio1(noteBase, scaleType) {
    score.leftSeq.addPattern(8, pattern23, noteBase, scaleType, {'octaveOffset': -1});
    score.rightSeq.addPattern(8, pattern22, noteBase, scaleType);
  }

  intro();
  theme1();
  theme2();
  segue();

  // Dramatic pause!
  score.leftSeq.addPattern(1, silencehalf, "F", "M");
  score.rightSeq.addPattern(1, silencehalf, "F", "M");

  arpeggio1("F", "M");
  arpeggio1("A", "m");
  arpeggio1("F", "M");
  arpeggio1("A", "m");

  intro();

  score.play(98, $("#score"));
}

function testVoicing() {
  var score = new Score(44);

  score.multiSeq.addSequence(1, function(seq) {
    seq.rightSeq.addPattern(1, pattern19, "G", "m");
    seq.rightSeq.addPattern(1, pattern20, "G", "m");
//    seq.rightSeq.addPattern(2, pattern17, "F", "M");
  });

/*  score.leftSeq.addPattern(2, pattern16, "F", "M");
  score.leftSeq.addPattern(2, pattern16, "F", "M7");
  score.leftSeq.addPattern(2, pattern16, "F", "M");
  score.leftSeq.addPattern(2, pattern16, "A", "m");
*/

  score.play(98, $("#score"));
}
