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
var silence34 = pattern9;
var silence44 = pattern10;

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
  var tempo = 170;

  score.multiSeq.addSequence(2, function(seq) {
    seq.addSequence(2, function(seq) {
      seq.addPattern(4, pattern6, silence34, "D", "m", 0);
      seq.addPattern(1, pattern6, pattern8, "D", "m", 0);  // Bass crossover.
      seq.addPattern(3, pattern6, silence34, "D", "m", 0);
    });
    seq.addPattern(2, pattern6, pattern7, "D", "m", 0);
    seq.addPattern(2, pattern6, pattern7, "D", "mM", 0);
    seq.addPattern(2, pattern6, pattern7, "G", "m", 0);
    seq.addPattern(2, pattern6, pattern7, "Eb", "M", 0);
    seq.addPattern(2, pattern6, pattern7, "C", "M", 0);
    seq.addPattern(2, pattern6, pattern7, "A", "M", 0);

    seq.addSequence(1, function(seq) {
      seq.addPattern(4, pattern6, silence34, "D", "m", 0);
      seq.addPattern(1, pattern6, pattern8, "D", "m", 0);  // Bass crossover.
      seq.addPattern(3, pattern6, silence34, "D", "m", 0);
    });

    seq.addSequence(2, function(seq) {
      seq.addPattern(2, pattern6, pattern11, "D", "M", 0);
      seq.addPattern(1, pattern6, pattern7, "F#", "M", 0);
      seq.addPattern(1, pattern6, pattern7, "F#", "7", 0);
      seq.addPattern(4, pattern6, pattern11, "D", "M", 0);
    });
  });

  score.play(tempo, $("#score"));
}

function playEtude12() {
  var score = new Score(34);
  var tempo = 170;

  score.leftSeq.addPattern(8, pattern12, "D", "m", -1);
  score.rightSeq.addPattern(4, silence44, "D", "m", -1);

  score.multiSeq.addSequence(2, function(seq) {
    seq.leftSeq.addPattern(6, pattern12, "D", "m", -1);
    seq.rightSeq.addPattern(8, pattern13, "D", "m", -1);
  });

  score.multiSeq.addSequence(2, function(seq) {
    seq.leftSeq.addPattern(6, pattern14, "Bb", "M", -1);
    seq.rightSeq.addPattern(8, pattern15, "Bb", "M", -1);
    seq.leftSeq.addPattern(6, pattern12, "D", "m", -1);
    seq.rightSeq.addPattern(8, pattern13, "D", "m", -1);
  });

  score.leftSeq.addPattern(6, pattern14, "Bb", "M", -1);
  score.rightSeq.addPattern(8, pattern15, "Bb", "M", -1);

  score.multiSeq.addSequence(2, function(seq) {
    seq.leftSeq.addPattern(6, pattern12, "D", "m", -1);
    seq.rightSeq.addPattern(8, pattern13, "D", "m", -1);
  });

  score.multiSeq.addSequence(2, function(seq) {
    seq.leftSeq.addPattern(6, pattern14, "A", "M", -1);
    seq.rightSeq.addPattern(8, pattern15, "A", "M", -1);
    seq.leftSeq.addPattern(3, pattern12, "D", "m", -1);
    seq.rightSeq.addPattern(4, pattern13, "D", "m", -1);
    seq.leftSeq.addPattern(3, pattern12, "D", "M", -1);
    seq.rightSeq.addPattern(4, pattern13, "D", "M", -1);
  });

  score.play(tempo, $("#score"));
}
