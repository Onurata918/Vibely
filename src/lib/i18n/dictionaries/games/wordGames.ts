export const wordGamesDict = {
  en: {
    // Truth or Dare
    todNextPlayerHeader: 'NEXT PLAYER',
    todTruthOption: 'Truth',
    todDareOption: 'Dare',
    todTruthBadge: 'TRUTH 🤔',
    todDareBadge: 'DARE 😈',
    todNextPlayerButton: 'Next Player',

    // Taboo
    tabuNextDescriberHeader: 'NEXT DESCRIBER',
    tabuInstructions: "Describe the word without saying the forbidden ones! Everyone else tries to guess.",
    tabuStartButton: 'Start 🗣️',
    tabuScoreLine: '{correct} correct · {skipped} skipped',
    tabuForbiddenWordsHeader: 'FORBIDDEN WORDS',
    tabuSkipButton: 'Skip',
    tabuCorrectButton: 'Correct',
    tabuTimeUpHeader: "Time's Up!",
    tabuRoundSummary: '{name}: {correct} correct, {skipped} skipped',
    tabuCloseButton: 'Close',
    tabuNextPlayerButton: 'Next Player',
    tabuResetRestart: 'Reset score and start over',

    // Heads Up
    headsUpNextGuesserHeader: 'NEXT GUESSER',
    headsUpInstructions: 'Hold the phone to your forehead facing out. Everyone else gives clues, you guess the word!',
    headsUpStartButton: 'Start 🎬',
    headsUpScoreLine: '{correct} correct · {skipped} skipped',
    headsUpSkipButton: 'Skip',
    headsUpCorrectButton: 'Correct',
    headsUpTimeUpHeader: "Time's Up!",
    headsUpRoundSummary: '{name}: {correct} correct, {skipped} skipped',
    headsUpCloseButton: 'Close',
    headsUpNextPlayerButton: 'Next Player',
    headsUpResetRestart: 'Reset score and start over',
  },
  tr: {
    // Doğruluk mu Cesaret mi?
    todNextPlayerHeader: 'SIRADAKİ OYUNCU',
    todTruthOption: 'Doğruluk',
    todDareOption: 'Cesaret',
    todTruthBadge: 'DOĞRULUK 🤔',
    todDareBadge: 'CESARET 😈',
    todNextPlayerButton: 'Sıradaki Oyuncu',

    // Tabu
    tabuNextDescriberHeader: 'SIRADAKİ ANLATICI',
    tabuInstructions: 'Kelimeyi anlat ama yasaklı kelimeleri kullanma! Diğerleri tahmin etsin.',
    tabuStartButton: 'Başlat 🗣️',
    tabuScoreLine: '{correct} doğru · {skipped} pas',
    tabuForbiddenWordsHeader: 'YASAKLI KELİMELER',
    tabuSkipButton: 'Pas',
    tabuCorrectButton: 'Doğru',
    tabuTimeUpHeader: 'Süre Doldu!',
    tabuRoundSummary: '{name}: {correct} doğru, {skipped} pas',
    tabuCloseButton: 'Kapat',
    tabuNextPlayerButton: 'Sıradaki Oyuncu',
    tabuResetRestart: 'Skoru sıfırla ve yeniden başlat',

    // Alında (Heads Up)
    headsUpNextGuesserHeader: 'SIRADAKİ TAHMİNCİ',
    headsUpInstructions: 'Telefonu alnına tut, ekran dışarı baksın. Diğerleri ipucu versin, sen kelimeyi tahmin et!',
    headsUpStartButton: 'Başlat 🎬',
    headsUpScoreLine: '{correct} doğru · {skipped} pas',
    headsUpSkipButton: 'Pas',
    headsUpCorrectButton: 'Doğru',
    headsUpTimeUpHeader: 'Süre Doldu!',
    headsUpRoundSummary: '{name}: {correct} doğru, {skipped} pas',
    headsUpCloseButton: 'Kapat',
    headsUpNextPlayerButton: 'Sıradaki Oyuncu',
    headsUpResetRestart: 'Skoru sıfırla ve yeniden başlat',
  },
} as const;
