export type MostLikelyCategory =
  | 'personality'
  | 'friendship'
  | 'love'
  | 'funny'
  | 'future'
  | 'party'
  | 'savage'
  | 'adventure';

export interface MostLikelyQuestion {
  id: string;
  category: MostLikelyCategory;
  tr: string;
  en: string;
}

export const MOST_LIKELY_QUESTIONS: MostLikelyQuestion[] = [
  { id: 'personality_egoist', category: 'personality', tr: 'Kim en egoist?', en: 'Who is the most selfish?' },
  { id: 'personality_jealous', category: 'personality', tr: 'Kim en kıskanç?', en: 'Who is the most jealous?' },
  { id: 'personality_stubborn', category: 'personality', tr: 'Kim en inatçı?', en: 'Who is the most stubborn?' },
  { id: 'personality_emotional', category: 'personality', tr: 'Kim en duygusal?', en: 'Who is the most emotional?' },
  { id: 'personality_dramatic', category: 'personality', tr: 'Kim en dramatik?', en: 'Who is the most dramatic?' },
  { id: 'personality_impatient', category: 'personality', tr: 'Kim en sabırsız?', en: 'Who is the most impatient?' },
  { id: 'personality_competitive', category: 'personality', tr: 'Kim en rekabetçi?', en: 'Who is the most competitive?' },
  { id: 'personality_ambitious', category: 'personality', tr: 'Kim en hırslı?', en: 'Who is the most ambitious?' },
  { id: 'personality_shy', category: 'personality', tr: 'Kim en utangaç?', en: 'Who is the shyest?' },
  { id: 'personality_social', category: 'personality', tr: 'Kim en sosyal?', en: 'Who is the most social?' },
  { id: 'personality_funny', category: 'personality', tr: 'Kim en komik?', en: 'Who is the funniest?' },
  { id: 'personality_trustworthy', category: 'personality', tr: 'Kim en güvenilir?', en: 'Who is the most trustworthy?' },
  { id: 'personality_brave', category: 'personality', tr: 'Kim en cesur?', en: 'Who is the bravest?' },
  { id: 'personality_organized', category: 'personality', tr: 'Kim en düzenli?', en: 'Who is the most organized?' },
  { id: 'personality_messy', category: 'personality', tr: 'Kim en dağınık?', en: 'Who is the messiest?' },

  { id: 'friendship_secret_keeper', category: 'friendship', tr: 'Kim en iyi sır tutar?', en: 'Who is the best at keeping secrets?' },
  { id: 'friendship_bad_secret_keeper', category: 'friendship', tr: 'Kim en kötü sır tutar?', en: 'Who is the worst at keeping secrets?' },
  { id: 'friendship_group_parent', category: 'friendship', tr: 'Kim grubun annesi/babası?', en: 'Who is the parent of the group?' },
  { id: 'friendship_therapist', category: 'friendship', tr: 'Kim grubun terapisti?', en: 'Who is the therapist of the group?' },
  { id: 'friendship_peacekeeper', category: 'friendship', tr: 'Kim herkesi en çok barıştırır?', en: 'Who is most likely to make everyone make up?' },
  { id: 'friendship_planner', category: 'friendship', tr: 'Kim planları en çok organize eder?', en: 'Who organizes the plans most often?' },
  { id: 'friendship_late', category: 'friendship', tr: 'Kim en çok geç kalır?', en: 'Who is always late?' },
  { id: 'friendship_cancel', category: 'friendship', tr: 'Kim plan yapıp gelmeme ihtimali en yüksek?', en: 'Who is most likely to make plans and not show up?' },
  { id: 'friendship_helpful', category: 'friendship', tr: 'Kim yardıma ilk koşar?', en: 'Who is the first to help a friend?' },
  { id: 'friendship_screenshots', category: 'friendship', tr: 'Kim mesajların ekran görüntüsünü gruba atar?', en: 'Who is most likely to screenshot messages and send them to the group?' },
  { id: 'friendship_borrow', category: 'friendship', tr: 'Kim borç verdiğini unutabilir?', en: 'Who is most likely to forget they lent someone money?' },
  { id: 'friendship_borrowed', category: 'friendship', tr: 'Kim borcunu unutabilir?', en: 'Who is most likely to forget they owe someone money?' },

  { id: 'love_flirty', category: 'love', tr: 'Kim en flörtöz?', en: 'Who is the biggest flirt?' },
  { id: 'love_romantic', category: 'love', tr: 'Kim en romantik?', en: 'Who is the most romantic?' },
  { id: 'love_falls_first', category: 'love', tr: 'Kim en çabuk aşık olur?', en: 'Who falls in love the fastest?' },
  { id: 'love_first_message', category: 'love', tr: 'Kim ilk mesajı atar?', en: 'Who is most likely to text first?' },
  { id: 'love_ghost', category: 'love', tr: 'Kim ghostlama ihtimali en yüksek?', en: 'Who is most likely to ghost someone?' },
  { id: 'love_stalk', category: 'love', tr: 'Kim en çok stalk yapar?', en: 'Who is most likely to stalk their crush online?' },
  { id: 'love_ex_return', category: 'love', tr: 'Kim eski sevgilisine geri dönme ihtimali en yüksek?', en: 'Who is most likely to get back with an ex?' },
  { id: 'love_first_marry', category: 'love', tr: 'Kim ilk evlenir?', en: 'Who is most likely to get married first?' },
  { id: 'love_long_relationship', category: 'love', tr: 'Kim en uzun ilişkiyi yaşar?', en: 'Who is most likely to have the longest relationship?' },
  { id: 'love_celebrity_date', category: 'love', tr: 'Kim ünlü biriyle sevgili olma ihtimali en yüksek?', en: 'Who is most likely to date a celebrity?' },
  { id: 'love_heartbreaker', category: 'love', tr: 'Kim en çok kalp kırar?', en: 'Who is most likely to break the most hearts?' },
  { id: 'love_wrong_crush', category: 'love', tr: 'Kim yanlış kişiye aşık olur?', en: 'Who is most likely to fall for the wrong person?' },

  { id: 'funny_lose_phone', category: 'funny', tr: 'Kim telefonunu kaybetme ihtimali en yüksek?', en: 'Who is most likely to lose their phone?' },
  { id: 'funny_miss_flight', category: 'funny', tr: 'Kim uçağı kaçırır?', en: 'Who is most likely to miss a flight?' },
  { id: 'funny_wrong_text', category: 'funny', tr: 'Kim yanlış kişiye mesaj atar?', en: 'Who is most likely to text the wrong person?' },
  { id: 'funny_sleep_anywhere', category: 'funny', tr: 'Kim her yerde uyuyabilir?', en: 'Who could fall asleep anywhere?' },
  { id: 'funny_late_night_food', category: 'funny', tr: "Kim gece 3'te yemek söyler?", en: 'Who is most likely to order food at 3 AM?' },
  { id: 'funny_impulse_hair', category: 'funny', tr: 'Kim bir anda saçını boyatır?', en: 'Who is most likely to dye their hair on impulse?' },
  { id: 'funny_tattoo', category: 'funny', tr: 'Kim aniden dövme yaptırır?', en: 'Who is most likely to get a spontaneous tattoo?' },
  { id: 'funny_viral_accident', category: 'funny', tr: 'Kim yanlışlıkla viral olur?', en: 'Who is most likely to go viral by accident?' },
  { id: 'funny_laugh_wrong_time', category: 'funny', tr: 'Kim yanlış zamanda gülmeye başlar?', en: 'Who is most likely to laugh at the worst possible time?' },
  { id: 'funny_forget_birthday', category: 'funny', tr: 'Kim doğum gününü unutur?', en: 'Who is most likely to forget a birthday?' },
  { id: 'funny_talk_sleep', category: 'funny', tr: 'Kim uykusunda konuşur?', en: 'Who is most likely to talk in their sleep?' },
  { id: 'funny_random_trip', category: 'funny', tr: 'Kim bir gecede seyahat planı yapar?', en: 'Who is most likely to book a random trip overnight?' },

  { id: 'future_rich', category: 'future', tr: 'Kim en zengin olur?', en: 'Who is most likely to become rich?' },
  { id: 'future_famous', category: 'future', tr: 'Kim en ünlü olur?', en: 'Who is most likely to become famous?' },
  { id: 'future_startup', category: 'future', tr: 'Kim şirket kurar?', en: 'Who is most likely to start a company?' },
  { id: 'future_move_abroad', category: 'future', tr: 'Kim başka ülkeye taşınır?', en: 'Who is most likely to move abroad?' },
  { id: 'future_influencer', category: 'future', tr: 'Kim influencer olur?', en: 'Who is most likely to become an influencer?' },
  { id: 'future_reality_tv', category: 'future', tr: "Kim reality show'a katılır?", en: 'Who is most likely to join a reality show?' },
  { id: 'future_early_retire', category: 'future', tr: 'Kim erken emekli olur?', en: 'Who is most likely to retire early?' },
  { id: 'future_dream_job', category: 'future', tr: 'Kim hayalindeki işe ilk ulaşır?', en: "Who is most likely to land their dream job first?" },
  { id: 'future_travel_world', category: 'future', tr: 'Kim dünyayı gezer?', en: 'Who is most likely to travel the world?' },
  { id: 'future_luxury', category: 'future', tr: 'Kim en lüks hayatı yaşar?', en: 'Who is most likely to live the most luxurious life?' },

  { id: 'party_party_lost', category: 'party', tr: 'Kim partide kaybolur?', en: 'Who is most likely to disappear at a party?' },
  { id: 'party_dance_first', category: 'party', tr: 'Kim dans etmeye ilk başlar?', en: 'Who is most likely to start dancing first?' },
  { id: 'party_last_leave', category: 'party', tr: 'Kim partiden en son çıkar?', en: 'Who is most likely to be the last one to leave a party?' },
  { id: 'party_karaoke', category: 'party', tr: 'Kim karaoke mikrofonunu bırakmaz?', en: 'Who is most likely to take over karaoke?' },
  { id: 'party_new_friends', category: 'party', tr: 'Kim bir gecede 10 yeni arkadaş edinir?', en: 'Who is most likely to make 10 new friends in one night?' },
  { id: 'party_embarrassing_story', category: 'party', tr: 'Kim ertesi gün anlatılacak bir olay yaşar?', en: 'Who is most likely to become the story everyone tells the next day?' },
  { id: 'party_spontaneous', category: 'party', tr: 'Kim son dakika parti planı yapar?', en: 'Who is most likely to make a last-minute party plan?' },
  { id: 'party_dj', category: 'party', tr: "Kim DJ'i ele geçirir?", en: 'Who is most likely to take over the music?' },
  { id: 'party_photos', category: 'party', tr: 'Kim gecenin en çok fotoğrafını çeker?', en: 'Who is most likely to take the most photos?' },
  { id: 'party_early_home', category: 'party', tr: 'Kim herkesten önce eve gider?', en: 'Who is most likely to go home first?' },

  { id: 'savage_main_character', category: 'savage', tr: 'Kim kendini en çok ana karakter sanıyor?', en: 'Who has the biggest main-character energy?' },
  { id: 'savage_attention', category: 'savage', tr: 'Kim ilgiyi en çok seviyor?', en: 'Who loves attention the most?' },
  { id: 'savage_argument', category: 'savage', tr: 'Kim tartışmayı en çok uzatır?', en: 'Who is most likely to keep an argument going?' },
  { id: 'savage_excuses', category: 'savage', tr: 'Kim en çok bahane üretir?', en: 'Who makes the most excuses?' },
  { id: 'savage_exaggerate', category: 'savage', tr: 'Kim en çok abartır?', en: 'Who exaggerates the most?' },
  { id: 'savage_spend', category: 'savage', tr: 'Kim parasını en hızlı harcar?', en: "Who is most likely to spend their money the fastest?" },
  { id: 'savage_luxury_obsessed', category: 'savage', tr: 'Kim lükse en düşkün?', en: 'Who is the most obsessed with luxury?' },
  { id: 'savage_selfie', category: 'savage', tr: 'Kim en çok selfie çeker?', en: 'Who takes the most selfies?' },
  { id: 'savage_social_media', category: 'savage', tr: 'Kim sosyal medyada en çok vakit geçirir?', en: 'Who spends the most time on social media?' },
  { id: 'savage_trip', category: 'savage', tr: 'Kim en çok trip atar?', en: 'Who gives the most attitude when upset?' },
  { id: 'savage_chaos', category: 'savage', tr: 'Kim grubun kaos kaynağı?', en: 'Who is the chaos of the group?' },
  { id: 'savage_always_right', category: 'savage', tr: 'Kim her zaman haklı çıkmaya çalışır?', en: "Who always tries to prove they're right?" },

  { id: 'adventure_zombie', category: 'adventure', tr: 'Kim zombi kıyametinde en uzun hayatta kalır?', en: 'Who would survive the longest in a zombie apocalypse?' },
  { id: 'adventure_island', category: 'adventure', tr: 'Kim ıssız adada en iyi hayatta kalır?', en: 'Who would survive best on a deserted island?' },
  { id: 'adventure_panic', category: 'adventure', tr: 'Kim acil durumda ilk panikler?', en: 'Who is most likely to panic first in an emergency?' },
  { id: 'adventure_road_trip', category: 'adventure', tr: "Kim road trip'in lideri olur?", en: 'Who would take charge on a road trip?' },
  { id: 'adventure_adrenaline', category: 'adventure', tr: 'Kim en çılgın aktiviteyi dener?', en: 'Who is most likely to try the craziest activity?' },
  { id: 'adventure_lost_city', category: 'adventure', tr: 'Kim yabancı bir şehirde kaybolur?', en: 'Who is most likely to get lost in a foreign city?' },
  { id: 'adventure_surprise_trip', category: 'adventure', tr: 'Kim sürpriz tatile evet der?', en: 'Who is most likely to say yes to a surprise trip?' },
  { id: 'adventure_camping', category: 'adventure', tr: 'Kim kamp hayatına en hızlı alışır?', en: 'Who would adapt to camping the fastest?' },
];

export const getQuestionsByCategory = (category: MostLikelyCategory) => MOST_LIKELY_QUESTIONS.filter((q) => q.category === category);

export const getRandomMostLikelyQuestion = (category?: MostLikelyCategory, excludeIds: string[] = []) => {
  const pool = MOST_LIKELY_QUESTIONS.filter((q) => (!category || q.category === category) && !excludeIds.includes(q.id));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
};
