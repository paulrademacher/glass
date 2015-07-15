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
