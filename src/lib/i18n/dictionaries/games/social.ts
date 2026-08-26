export const socialGamesDict = {
  en: {
    // Spy game — reveal phase
    spyPlayerCounter: 'PLAYER {current} / {total}',
    spyTapToReveal: 'Tap to see your card',
    spyPhoneHolderHint: '{name} should be holding the phone',
    spyYouAreSpy: "You're the Spy!",
    spySpyInstructions: "You don't know the location. Listen to the conversation and try to guess it without giving yourself away.",
    spyVillagerInstructions: 'Figure out who the spy is by asking questions.',
    spyHideAndNext: 'Hide & Pass to Next Player',

    // Spy game — discuss phase
    spyDiscussTitle: 'Discussion Time',
    spyDiscussInstructions:
      "Everyone knows the location except the spy. Ask each other questions about the location to sniff out the spy — who's trying not to give it away.",
    spyGoToVoteButton: 'Start Voting',

    // Spy game — vote phase
    spyVoteTitle: "Who's the Spy?",
    spyVoteSubtitle: 'Pick who you think is the spy',

    // Spy game — result phase
    spyResultCorrect: 'You got it right!',
    spyResultSpyEscaped: 'The spy got away!',
    spyVotedLabel: 'Voted For',
    spyActualSpyLabel: 'Actual Spy',
    spyLocationLabel: 'Location',
    spyCloseButton: 'Close',
    spyPlayAgainButton: 'Play Again',

    // Vampire Villager — reveal phase
    vampirePlayerCounter: 'PLAYER {current} / {total}',
    vampireTapToReveal: 'Tap to see your card',
    vampirePhoneHolderHint: '{name} should be holding the phone',
    vampireYouAreVampire: "You're a Vampire!",
    vampireVampireInstructions: "Pick a victim at night — don't let anyone catch on.",
    vampireOtherVampireSingular: 'Other vampire: {names}',
    vampireOtherVampiresPlural: 'Other vampires: {names}',
    vampireYouAreVillager: "You're a Villager",
    vampireVillagerInstructions: 'Try to find and eliminate the vampires.',
    vampireHideAndNext: 'Hide & Pass to Next Player',

    // Vampire Villager — night phase
    vampireNightTitle: 'Night',
    vampireNightInstructions:
      'Everyone close your eyes. Vampires, quietly agree on a victim, then whoever is holding the phone marks the choice.',
    vampireKilledMessage: '{name} was killed',
    vampireNightRevealVampire: 'Turns out they were a vampire 🧛',
    vampireNightRevealVillager: 'Turns out they were a villager 🧑‍🌾',
    vampireRemainingCount: 'Remaining: {villagers} villagers, {vampires} vampires',
    vampireGoToVoteButton: 'Start Voting',

    // Vampire Villager — day vote phase
    vampireDayVoteTitle: 'Day Vote',
    vampireDayVoteSubtitle: 'Who are we hanging? Discuss it and pick by majority vote.',
    vampireHangedMessage: '{name} was hanged',
    vampireDayRevealVampire: 'Turns out they were a vampire 🧛 — the villagers called it!',
    vampireDayRevealVillager: 'Turns out they were a villager 🧑‍🌾 — an innocent is gone...',
    vampireGoToNightButton: 'Continue to Night',

    // Vampire Villager — end phase
    vampireVillagersWin: 'Villagers Win!',
    vampireVampiresWin: 'Vampires Win!',
    vampireRoleVampireBadge: '🧛 Vampire',
    vampireRoleVillagerBadge: '🧑‍🌾 Villager',
    vampireEliminatedSuffix: ' · eliminated',
    vampireCloseButton: 'Close',
    vampirePlayAgainButton: 'Play Again',

    // Last Card (Uno) — colors
    unoColorRed: 'Red',
    unoColorYellow: 'Yellow',
    unoColorGreen: 'Green',
    unoColorBlue: 'Blue',

    // Last Card (Uno) — main table
    unoRoundLabel: 'Round {round}',
    unoTurnLabel: 'Turn: {name}',
    unoCatchButton: "🚨 {name} didn't say UNO! Catch them (+2)",
    unoHandCount: '{count} 🎴',
    unoEndTurnButton: 'End Turn',
    unoPlayCardHint: 'Play a card from your hand:',

    // Last Card (Uno) — color picker
    unoColorPickerTitle: 'Pick a Color 🎨',

    // Last Card (Uno) — declare UNO
    unoOneCardLeftTitle: "{name}, you're down to your last card!",
    unoDeclareInstructions: "If you don't call it now, you could get caught once the phone moves on and draw 2 penalty cards",
    unoDeclareButton: 'UNO! 🎉',
    unoSkipDeclareButton: 'Skip (risk it)',

    // Last Card (Uno) — draw four challenge
    unoDrawFourTitle: '{name} played a +4',
    unoDrawFourInstructions:
      "{name} should be holding the phone. If you think they had a card they could've played in the previous color, you can challenge — if you're right, they draw 4, if you're wrong, you draw 6",
    unoAcceptDrawFourButton: 'Accept (+4 draw)',
    unoChallengeButton: 'Challenge 🤨',

    // Last Card (Uno) — game over
    unoWinnerTitle: '{name} Wins!',
    unoScoreGained: '+{score} points',
    unoFinishedHand: 'finished their hand',
    unoCardsLeft: '{count} cards left',
    unoTotalScore: 'total {score}',
    unoCloseButton: 'Close',
    unoRestartButton: 'Start Over',
    unoNextRoundButton: 'Next Round',

    unoSkippedMsg: '{name} was skipped ⊘',
    unoDirectionChangedMsg: 'Direction changed ⇄',
    unoDrawTwoMsg: '{name} drew 2 🃏',
    unoCaughtMsg: 'UNO caught! +2 penalty 🚨',
    unoDrawFourMsg: '{name} drew 4 🃏',
    unoChallengeCorrectMsg: 'Challenge correct! {name} drew 4 😬',
    unoChallengeIncorrectMsg: 'Challenge wrong! {name} drew 6 😅',
  },
  tr: {
    // Spy game — reveal phase
    spyPlayerCounter: 'OYUNCU {current} / {total}',
    spyTapToReveal: 'Kartını görmek için dokun',
    spyPhoneHolderHint: 'Telefonu {name} tutuyor olmalı',
    spyYouAreSpy: 'Sen Casussun!',
    spySpyInstructions: 'Mekanı bilmiyorsun. Sohbeti dinle, belli etmeden mekanı tahmin etmeye çalış.',
    spyVillagerInstructions: 'Casus kim, sorular sorarak bulmaya çalış.',
    spyHideAndNext: 'Gizle ve Sıradakine Geç',

    // Spy game — discuss phase
    spyDiscussTitle: 'Tartışma Zamanı',
    spyDiscussInstructions:
      'Herkes mekanı biliyor, casus bilmiyor. Birbirinize mekanla ilgili sorular sorarak casusu bulmaya çalışın — casus da belli etmemeye çalışıyor.',
    spyGoToVoteButton: 'Oylamaya Geç',

    // Spy game — vote phase
    spyVoteTitle: 'Kim Casus?',
    spyVoteSubtitle: 'Casus olduğunu düşündüğün kişiyi seç',

    // Spy game — result phase
    spyResultCorrect: 'Doğru bildiniz!',
    spyResultSpyEscaped: 'Casus kurtuldu!',
    spyVotedLabel: 'Oylanan',
    spyActualSpyLabel: 'Gerçek Casus',
    spyLocationLabel: 'Mekan',
    spyCloseButton: 'Kapat',
    spyPlayAgainButton: 'Yeniden Oyna',

    // Vampire Villager — reveal phase
    vampirePlayerCounter: 'OYUNCU {current} / {total}',
    vampireTapToReveal: 'Kartını görmek için dokun',
    vampirePhoneHolderHint: 'Telefonu {name} tutuyor olmalı',
    vampireYouAreVampire: 'Vampirsin!',
    vampireVampireInstructions: 'Gece bir kurban seç, kimseye belli etme.',
    vampireOtherVampireSingular: 'Diğer vampir: {names}',
    vampireOtherVampiresPlural: 'Diğer vampirler: {names}',
    vampireYouAreVillager: 'Köylüsün',
    vampireVillagerInstructions: 'Vampirleri bulup elemeye çalış.',
    vampireHideAndNext: 'Gizle ve Sıradakine Geç',

    // Vampire Villager — night phase
    vampireNightTitle: 'Gece',
    vampireNightInstructions:
      'Herkes gözlerini kapatsın. Vampirler sessizce aralarında bir kurban seçsin, sonra cihazı tutan kişi seçimi işaretlesin.',
    vampireKilledMessage: '{name} öldürüldü',
    vampireNightRevealVampire: 'Vampir imiş 🧛',
    vampireNightRevealVillager: 'Köylü imiş 🧑‍🌾',
    vampireRemainingCount: 'Kalan: {villagers} köylü, {vampires} vampir',
    vampireGoToVoteButton: 'Oylamaya Geç',

    // Vampire Villager — day vote phase
    vampireDayVoteTitle: 'Gündüz Oylaması',
    vampireDayVoteSubtitle: 'Kimi asıyoruz? Tartışıp oy çokluğuyla seçin.',
    vampireHangedMessage: '{name} asıldı',
    vampireDayRevealVampire: 'Vampir imiş 🧛 — köylüler haklı çıktı!',
    vampireDayRevealVillager: 'Köylü imiş 🧑‍🌾 — masum biri gitti...',
    vampireGoToNightButton: 'Geceye Geç',

    // Vampire Villager — end phase
    vampireVillagersWin: 'Köylüler Kazandı!',
    vampireVampiresWin: 'Vampirler Kazandı!',
    vampireRoleVampireBadge: '🧛 Vampir',
    vampireRoleVillagerBadge: '🧑‍🌾 Köylü',
    vampireEliminatedSuffix: ' · elendi',
    vampireCloseButton: 'Kapat',
    vampirePlayAgainButton: 'Yeniden Oyna',

    // Last Card (Uno) — colors
    unoColorRed: 'Kırmızı',
    unoColorYellow: 'Sarı',
    unoColorGreen: 'Yeşil',
    unoColorBlue: 'Mavi',

    // Last Card (Uno) — main table
    unoRoundLabel: '{round}. El',
    unoTurnLabel: 'Sıra: {name}',
    unoCatchButton: '🚨 {name} UNO demedi! Yakala (+2)',
    unoHandCount: '{count} 🎴',
    unoEndTurnButton: 'Turu Bitir',
    unoPlayCardHint: 'Elinden bir kart oyna:',

    // Last Card (Uno) — color picker
    unoColorPickerTitle: 'Renk Seç 🎨',

    // Last Card (Uno) — declare UNO
    unoOneCardLeftTitle: '{name}, tek kartın kaldı!',
    unoDeclareInstructions: 'Şimdi demezsen, telefon başkasına geçtiğinde yakalanıp 2 ceza kartı çekebilirsin',
    unoDeclareButton: 'UNO! 🎉',
    unoSkipDeclareButton: 'Geç (riske gir)',

    // Last Card (Uno) — draw four challenge
    unoDrawFourTitle: '{name}, +4 attı',
    unoDrawFourInstructions:
      'Telefonu {name} tutuyor olmalı. Elinde önceki renkten oynayabileceği bir kart olduğunu düşünüyorsan itiraz edebilirsin — haklıysan o 4 çeker, haksızsan sen 6 çekersin',
    unoAcceptDrawFourButton: 'Kabul Et (+4 çek)',
    unoChallengeButton: 'İtiraz Et 🤨',

    // Last Card (Uno) — game over
    unoWinnerTitle: '{name} Kazandı!',
    unoScoreGained: '+{score} puan',
    unoFinishedHand: 'elini bitirdi',
    unoCardsLeft: '{count} kart kaldı',
    unoTotalScore: 'toplam {score}',
    unoCloseButton: 'Kapat',
    unoRestartButton: 'Baştan Başla',
    unoNextRoundButton: 'Sonraki El',

    unoSkippedMsg: '{name} sırayı atlattı ⊘',
    unoDirectionChangedMsg: 'Yön değişti ⇄',
    unoDrawTwoMsg: '{name} +2 çekti 🃏',
    unoCaughtMsg: 'UNO yakalandı! +2 ceza 🚨',
    unoDrawFourMsg: '{name} +4 çekti 🃏',
    unoChallengeCorrectMsg: 'İtiraz haklı! {name} 4 çekti 😬',
    unoChallengeIncorrectMsg: 'İtiraz haksız! {name} 6 çekti 😅',
  },
} as const;
