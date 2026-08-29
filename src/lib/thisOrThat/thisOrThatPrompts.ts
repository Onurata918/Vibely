export type ThisOrThatCategory = 'food' | 'lifestyle' | 'love' | 'friends' | 'party' | 'money' | 'travel' | 'entertainment' | 'sports' | 'spicy' | 'random';

export type LocalizedChoice = { tr: string; en: string };

export type ThisOrThatPrompt = {
  id: string;
  category: ThisOrThatCategory;
  left: LocalizedChoice;
  right: LocalizedChoice;
  leftEmoji?: string;
  rightEmoji?: string;
};

export const THIS_OR_THAT_PROMPTS: ThisOrThatPrompt[] = [
  // FOOD
  { id: 'food_coffee_tea', category: 'food', left: { en: 'Coffee', tr: 'Kahve' }, right: { en: 'Tea', tr: 'Çay' }, leftEmoji: '☕', rightEmoji: '🍵' },
  { id: 'food_sweet_salty', category: 'food', left: { en: 'Sweet', tr: 'Tatlı' }, right: { en: 'Salty', tr: 'Tuzlu' }, leftEmoji: '🍰', rightEmoji: '🧂' },
  { id: 'food_pizza_burger', category: 'food', left: { en: 'Pizza', tr: 'Pizza' }, right: { en: 'Burger', tr: 'Burger' }, leftEmoji: '🍕', rightEmoji: '🍔' },
  { id: 'food_pasta_pizza', category: 'food', left: { en: 'Pasta', tr: 'Makarna' }, right: { en: 'Pizza', tr: 'Pizza' }, leftEmoji: '🍝', rightEmoji: '🍕' },
  { id: 'food_breakfast_dinner', category: 'food', left: { en: 'Breakfast', tr: 'Kahvaltı' }, right: { en: 'Dinner', tr: 'Akşam Yemeği' }, leftEmoji: '🍳', rightEmoji: '🍽️' },
  { id: 'food_chocolate_vanilla', category: 'food', left: { en: 'Chocolate', tr: 'Çikolata' }, right: { en: 'Vanilla', tr: 'Vanilya' }, leftEmoji: '🍫', rightEmoji: '🍦' },
  { id: 'food_coke_sprite', category: 'food', left: { en: 'Coke', tr: 'Kola' }, right: { en: 'Sprite', tr: 'Sprite' }, leftEmoji: '🥤', rightEmoji: '🍋' },
  { id: 'food_mcdonalds_bk', category: 'food', left: { en: "McDonald's", tr: "McDonald's" }, right: { en: 'Burger King', tr: 'Burger King' }, leftEmoji: '🍟', rightEmoji: '🍔' },
  { id: 'food_kebab_doner', category: 'food', left: { en: 'Kebab', tr: 'Kebap' }, right: { en: 'Döner', tr: 'Döner' }, leftEmoji: '🍢', rightEmoji: '🌯' },
  { id: 'food_sushi_pizza', category: 'food', left: { en: 'Sushi', tr: 'Suşi' }, right: { en: 'Pizza', tr: 'Pizza' }, leftEmoji: '🍣', rightEmoji: '🍕' },
  { id: 'food_icecream_cake', category: 'food', left: { en: 'Ice Cream', tr: 'Dondurma' }, right: { en: 'Cake', tr: 'Pasta' }, leftEmoji: '🍦', rightEmoji: '🎂' },
  { id: 'food_homemade_takeaway', category: 'food', left: { en: 'Homemade Food', tr: 'Ev Yemeği' }, right: { en: 'Takeaway', tr: 'Paket Yemek' }, leftEmoji: '🍲', rightEmoji: '🥡' },
  { id: 'food_spicy_mild', category: 'food', left: { en: 'Spicy', tr: 'Acılı' }, right: { en: 'Mild', tr: 'Az Baharatlı' }, leftEmoji: '🌶️', rightEmoji: '🥛' },
  { id: 'food_hotcoffee_icedcoffee', category: 'food', left: { en: 'Hot Coffee', tr: 'Sıcak Kahve' }, right: { en: 'Iced Coffee', tr: 'Soğuk Kahve' }, leftEmoji: '☕', rightEmoji: '🧊' },
  { id: 'food_pancakes_waffles', category: 'food', left: { en: 'Pancakes', tr: 'Pankek' }, right: { en: 'Waffles', tr: 'Waffle' }, leftEmoji: '🥞', rightEmoji: '🧇' },

  // LIFESTYLE
  { id: 'lifestyle_party_home', category: 'lifestyle', left: { en: 'Party', tr: 'Parti' }, right: { en: 'Home', tr: 'Ev' }, leftEmoji: '🎉', rightEmoji: '🏠' },
  { id: 'lifestyle_morning_night', category: 'lifestyle', left: { en: 'Morning', tr: 'Sabah' }, right: { en: 'Night', tr: 'Gece' }, leftEmoji: '🌅', rightEmoji: '🌙' },
  { id: 'lifestyle_summer_winter', category: 'lifestyle', left: { en: 'Summer', tr: 'Yaz' }, right: { en: 'Winter', tr: 'Kış' }, leftEmoji: '☀️', rightEmoji: '❄️' },
  { id: 'lifestyle_city_countryside', category: 'lifestyle', left: { en: 'City', tr: 'Şehir' }, right: { en: 'Countryside', tr: 'Kırsal' }, leftEmoji: '🏙️', rightEmoji: '🌳' },
  { id: 'lifestyle_shower_bath', category: 'lifestyle', left: { en: 'Shower', tr: 'Duş' }, right: { en: 'Bath', tr: 'Küvet' }, leftEmoji: '🚿', rightEmoji: '🛁' },
  { id: 'lifestyle_gym_running', category: 'lifestyle', left: { en: 'Gym', tr: 'Spor Salonu' }, right: { en: 'Running', tr: 'Koşu' }, leftEmoji: '🏋️', rightEmoji: '🏃' },
  { id: 'lifestyle_earlybird_nightowl', category: 'lifestyle', left: { en: 'Early Bird', tr: 'Erkenci Kuş' }, right: { en: 'Night Owl', tr: 'Gece Kuşu' }, leftEmoji: '🌅', rightEmoji: '🦉' },
  { id: 'lifestyle_texting_calling', category: 'lifestyle', left: { en: 'Texting', tr: 'Mesajlaşma' }, right: { en: 'Calling', tr: 'Arama' }, leftEmoji: '💬', rightEmoji: '📞' },
  { id: 'lifestyle_online_instore', category: 'lifestyle', left: { en: 'Online Shopping', tr: 'Online Alışveriş' }, right: { en: 'In-store Shopping', tr: 'Mağazadan Alışveriş' }, leftEmoji: '🛒', rightEmoji: '🏬' },
  { id: 'lifestyle_sneakers_formal', category: 'lifestyle', left: { en: 'Sneakers', tr: 'Spor Ayakkabı' }, right: { en: 'Formal Shoes', tr: 'Klasik Ayakkabı' }, leftEmoji: '👟', rightEmoji: '👞' },
  { id: 'lifestyle_casual_formal', category: 'lifestyle', left: { en: 'Casual', tr: 'Rahat Giyim' }, right: { en: 'Formal', tr: 'Şık Giyim' }, leftEmoji: '👕', rightEmoji: '🤵' },
  { id: 'lifestyle_music_podcasts', category: 'lifestyle', left: { en: 'Music', tr: 'Müzik' }, right: { en: 'Podcasts', tr: 'Podcast' }, leftEmoji: '🎵', rightEmoji: '🎙️' },
  { id: 'lifestyle_book_movie', category: 'lifestyle', left: { en: 'Book', tr: 'Kitap' }, right: { en: 'Movie', tr: 'Film' }, leftEmoji: '📖', rightEmoji: '🎬' },
  { id: 'lifestyle_tiktok_instagram', category: 'lifestyle', left: { en: 'TikTok', tr: 'TikTok' }, right: { en: 'Instagram', tr: 'Instagram' }, leftEmoji: '🎵', rightEmoji: '📸' },
  { id: 'lifestyle_iphone_android', category: 'lifestyle', left: { en: 'iPhone', tr: 'iPhone' }, right: { en: 'Android', tr: 'Android' }, leftEmoji: '📱', rightEmoji: '🤖' },

  // LOVE
  { id: 'love_money_love', category: 'love', left: { en: 'Money', tr: 'Para' }, right: { en: 'Love', tr: 'Aşk' }, leftEmoji: '💸', rightEmoji: '❤️' },
  { id: 'love_looks_personality', category: 'love', left: { en: 'Looks', tr: 'Görünüş' }, right: { en: 'Personality', tr: 'Karakter' }, leftEmoji: '😍', rightEmoji: '💭' },
  { id: 'love_love_career', category: 'love', left: { en: 'Love', tr: 'Aşk' }, right: { en: 'Career', tr: 'Kariyer' }, leftEmoji: '❤️', rightEmoji: '💼' },
  { id: 'love_firstmove_wait', category: 'love', left: { en: 'Make the First Move', tr: 'İlk Adımı Atmak' }, right: { en: 'Wait', tr: 'Beklemek' }, leftEmoji: '🙋', rightEmoji: '⏳' },
  { id: 'love_relationship_single', category: 'love', left: { en: 'Relationship', tr: 'İlişki' }, right: { en: 'Single Life', tr: 'Bekarlık' }, leftEmoji: '💑', rightEmoji: '🕺' },
  { id: 'love_romantic_funny', category: 'love', left: { en: 'Romantic', tr: 'Romantik' }, right: { en: 'Funny', tr: 'Komik' }, leftEmoji: '🌹', rightEmoji: '😂' },
  { id: 'love_older_younger', category: 'love', left: { en: 'Older', tr: 'Büyük Yaşta' }, right: { en: 'Younger', tr: 'Küçük Yaşta' }, leftEmoji: '👵', rightEmoji: '👶' },
  { id: 'love_tall_short', category: 'love', left: { en: 'Tall', tr: 'Uzun Boylu' }, right: { en: 'Short', tr: 'Kısa Boylu' }, leftEmoji: '📏', rightEmoji: '🤏' },
  { id: 'love_datenight_stayhome', category: 'love', left: { en: 'Date Night', tr: 'Dışarıda Randevu' }, right: { en: 'Stay Home Together', tr: 'Evde Beraber Kalmak' }, leftEmoji: '🍷', rightEmoji: '🏠' },
  { id: 'love_flowers_gifts', category: 'love', left: { en: 'Flowers', tr: 'Çiçek' }, right: { en: 'Gifts', tr: 'Hediye' }, leftEmoji: '💐', rightEmoji: '🎁' },
  { id: 'love_goodmorning_goodnight', category: 'love', left: { en: 'Good Morning Text', tr: 'Günaydın Mesajı' }, right: { en: 'Good Night Text', tr: 'İyi Geceler Mesajı' }, leftEmoji: '☀️', rightEmoji: '🌙' },
  { id: 'love_callallnight_textallday', category: 'love', left: { en: 'Call All Night', tr: 'Gece Boyu Konuşmak' }, right: { en: 'Text All Day', tr: 'Gün Boyu Yazışmak' }, leftEmoji: '📞', rightEmoji: '💬' },
  { id: 'love_longdistance_breakup', category: 'love', left: { en: 'Long Distance', tr: 'Uzak Mesafe' }, right: { en: 'Break Up', tr: 'Ayrılık' }, leftEmoji: '✈️', rightEmoji: '💔' },
  { id: 'love_forgive_forget', category: 'love', left: { en: 'Forgive', tr: 'Affetmek' }, right: { en: 'Forget', tr: 'Unutmak' }, leftEmoji: '🤝', rightEmoji: '🚫' },
  { id: 'love_exback_moveon', category: 'love', left: { en: 'Ex Back', tr: 'Eskiye Dönmek' }, right: { en: 'Move On', tr: 'Hayatına Devam Etmek' }, leftEmoji: '🔙', rightEmoji: '➡️' },
  { id: 'love_firstsight_friendsfirst', category: 'love', left: { en: 'Love at First Sight', tr: 'İlk Görüşte Aşk' }, right: { en: 'Friends First', tr: 'Önce Arkadaşlık' }, leftEmoji: '💘', rightEmoji: '🤝' },
  { id: 'love_jealous_toochill', category: 'love', left: { en: 'Jealous', tr: 'Kıskanç' }, right: { en: 'Too Chill', tr: 'Fazla Rahat' }, leftEmoji: '😤', rightEmoji: '😌' },
  { id: 'love_pda_private', category: 'love', left: { en: 'PDA', tr: 'Herkesin Önünde Sevgi Gösterisi' }, right: { en: 'Keep It Private', tr: 'Gizli Tutmak' }, leftEmoji: '🤗', rightEmoji: '🤫' },
  { id: 'love_samepersonality_opposites', category: 'love', left: { en: 'Same Personality', tr: 'Aynı Karakter' }, right: { en: 'Opposites Attract', tr: 'Zıt Kutuplar' }, leftEmoji: '🪞', rightEmoji: '🧲' },
  { id: 'love_firstkiss_firstiloveyou', category: 'love', left: { en: 'First Kiss', tr: 'İlk Öpücük' }, right: { en: 'First "I Love You"', tr: 'İlk "Seni Seviyorum"' }, leftEmoji: '💋', rightEmoji: '💬' },

  // FRIENDS
  { id: 'friends_biggroup_smallcircle', category: 'friends', left: { en: 'Big Friend Group', tr: 'Kalabalık Arkadaş Grubu' }, right: { en: 'Small Circle', tr: 'Dar Çevre' }, leftEmoji: '👥', rightEmoji: '👤' },
  { id: 'friends_onebestfriend_manyclose', category: 'friends', left: { en: 'One Best Friend', tr: 'Tek Can Dostu' }, right: { en: 'Many Close Friends', tr: 'Birçok Yakın Arkadaş' }, leftEmoji: '🤝', rightEmoji: '👥' },
  { id: 'friends_honest_supportive', category: 'friends', left: { en: 'Honest Friend', tr: 'Dürüst Arkadaş' }, right: { en: 'Supportive Friend', tr: 'Destekleyici Arkadaş' }, leftEmoji: '🗣️', rightEmoji: '🤗' },
  { id: 'friends_groupchat_facetime', category: 'friends', left: { en: 'Group Chat', tr: 'Grup Sohbeti' }, right: { en: 'FaceTime', tr: 'Görüntülü Konuşma' }, leftEmoji: '💬', rightEmoji: '📹' },
  { id: 'friends_planned_spontaneous', category: 'friends', left: { en: 'Planned Trip', tr: 'Planlı Gezi' }, right: { en: 'Spontaneous Trip', tr: 'Anlık Gezi' }, leftEmoji: '🗺️', rightEmoji: '🎒' },
  { id: 'friends_friendshouse_goingout', category: 'friends', left: { en: "Friend's House", tr: 'Arkadaşın Evi' }, right: { en: 'Going Out', tr: 'Dışarı Çıkmak' }, leftEmoji: '🏠', rightEmoji: '🌃' },
  { id: 'friends_forgive_cutoff', category: 'friends', left: { en: 'Forgive a Friend', tr: 'Arkadaşı Affetmek' }, right: { en: 'Cut Them Off', tr: 'İlişkiyi Kesmek' }, leftEmoji: '🤝', rightEmoji: '✂️' },
  { id: 'friends_truth_protect', category: 'friends', left: { en: 'Tell the Truth', tr: 'Gerçeği Söylemek' }, right: { en: 'Protect Their Feelings', tr: 'Duygularını Korumak' }, leftEmoji: '🗣️', rightEmoji: '💛' },
  { id: 'friends_borrowmoney_borrowclothes', category: 'friends', left: { en: 'Borrow Money', tr: 'Para İstemek' }, right: { en: 'Borrow Clothes', tr: 'Kıyafet İstemek' }, leftEmoji: '💵', rightEmoji: '👕' },
  { id: 'friends_sameinterests_different', category: 'friends', left: { en: 'Same Interests', tr: 'Aynı İlgi Alanları' }, right: { en: 'Different Interests', tr: 'Farklı İlgi Alanları' }, leftEmoji: '🎯', rightEmoji: '🔀' },

  // PARTY
  { id: 'party_club_houseparty', category: 'party', left: { en: 'Club', tr: 'Kulüp' }, right: { en: 'House Party', tr: 'Ev Partisi' }, leftEmoji: '🪩', rightEmoji: '🏠' },
  { id: 'party_dance_sittalk', category: 'party', left: { en: 'Dance', tr: 'Dans Etmek' }, right: { en: 'Sit and Talk', tr: 'Oturup Sohbet Etmek' }, leftEmoji: '💃', rightEmoji: '🗣️' },
  { id: 'party_karaoke_dancing', category: 'party', left: { en: 'Karaoke', tr: 'Karaoke' }, right: { en: 'Dancing', tr: 'Dans' }, leftEmoji: '🎤', rightEmoji: '💃' },
  { id: 'party_bigparty_smallgathering', category: 'party', left: { en: 'Big Party', tr: 'Büyük Parti' }, right: { en: 'Small Gathering', tr: 'Küçük Buluşma' }, leftEmoji: '🎉', rightEmoji: '🧑‍🤝‍🧑' },
  { id: 'party_dj_livemusic', category: 'party', left: { en: 'DJ', tr: 'DJ' }, right: { en: 'Live Music', tr: 'Canlı Müzik' }, leftEmoji: '🎧', rightEmoji: '🎸' },
  { id: 'party_arriveearly_arrivelate', category: 'party', left: { en: 'Arrive Early', tr: 'Erken Gelmek' }, right: { en: 'Arrive Late', tr: 'Geç Gelmek' }, leftEmoji: '⏰', rightEmoji: '🕙' },
  { id: 'party_stayuntilend_leaveearly', category: 'party', left: { en: 'Stay Until the End', tr: 'Sonuna Kadar Kalmak' }, right: { en: 'Leave Early', tr: 'Erken Ayrılmak' }, leftEmoji: '🌙', rightEmoji: '🚪' },
  { id: 'party_withfriends_newpeople', category: 'party', left: { en: 'Party With Friends', tr: 'Arkadaşlarla Parti' }, right: { en: 'Meet New People', tr: 'Yeni İnsanlarla Tanışmak' }, leftEmoji: '👥', rightEmoji: '🆕' },

  // MONEY
  { id: 'money_rich_famous', category: 'money', left: { en: 'Rich', tr: 'Zengin' }, right: { en: 'Famous', tr: 'Ünlü' }, leftEmoji: '💰', rightEmoji: '🌟' },
  { id: 'money_money_freetime', category: 'money', left: { en: 'Money', tr: 'Para' }, right: { en: 'Free Time', tr: 'Boş Zaman' }, leftEmoji: '💵', rightEmoji: '⏰' },
  { id: 'money_1mnow_10min10y', category: 'money', left: { en: '£1 Million Now', tr: 'Şimdi 1 Milyon' }, right: { en: '£10 Million in 10 Years', tr: '10 Yılda 10 Milyon' }, leftEmoji: '💵', rightEmoji: '⏳' },
  { id: 'money_dreamjob_highsalary', category: 'money', left: { en: 'Dream Job', tr: 'Hayalindeki İş' }, right: { en: 'High Salary', tr: 'Yüksek Maaş' }, leftEmoji: '💭', rightEmoji: '💰' },
  { id: 'money_save_spend', category: 'money', left: { en: 'Save', tr: 'Biriktirmek' }, right: { en: 'Spend', tr: 'Harcamak' }, leftEmoji: '🏦', rightEmoji: '🛍️' },
  { id: 'money_house_supercar', category: 'money', left: { en: 'House', tr: 'Ev' }, right: { en: 'Supercar', tr: 'Süper Araba' }, leftEmoji: '🏡', rightEmoji: '🏎️' },
  { id: 'money_travelworld_dreamhouse', category: 'money', left: { en: 'Travel the World', tr: 'Dünyayı Gezmek' }, right: { en: 'Own a Dream House', tr: 'Hayalindeki Evi Sahiplenmek' }, leftEmoji: '🌍', rightEmoji: '🏡' },
  { id: 'money_bizowner_highpaidemployee', category: 'money', left: { en: 'Business Owner', tr: 'İşletme Sahibi' }, right: { en: 'High-Paid Employee', tr: 'Yüksek Maaşlı Çalışan' }, leftEmoji: '💼', rightEmoji: '👔' },
  { id: 'money_100kcash_freeflights', category: 'money', left: { en: '£100k Cash', tr: '100 Bin Nakit' }, right: { en: 'Free Flights for Life', tr: 'Ömür Boyu Uçuş' }, leftEmoji: '💵', rightEmoji: '✈️' },
  { id: 'money_luxurycar_luxuryapartment', category: 'money', left: { en: 'Luxury Car', tr: 'Lüks Araba' }, right: { en: 'Luxury Apartment', tr: 'Lüks Daire' }, leftEmoji: '🏎️', rightEmoji: '🏙️' },

  // TRAVEL
  { id: 'travel_london_newyork', category: 'travel', left: { en: 'London', tr: 'Londra' }, right: { en: 'New York', tr: 'New York' }, leftEmoji: '🇬🇧', rightEmoji: '🇺🇸' },
  { id: 'travel_paris_rome', category: 'travel', left: { en: 'Paris', tr: 'Paris' }, right: { en: 'Rome', tr: 'Roma' }, leftEmoji: '🇫🇷', rightEmoji: '🇮🇹' },
  { id: 'travel_istanbul_dubai', category: 'travel', left: { en: 'Istanbul', tr: 'İstanbul' }, right: { en: 'Dubai', tr: 'Dubai' }, leftEmoji: '🇹🇷', rightEmoji: '🇦🇪' },
  { id: 'travel_beach_mountains', category: 'travel', left: { en: 'Beach', tr: 'Sahil' }, right: { en: 'Mountains', tr: 'Dağ' }, leftEmoji: '🏖️', rightEmoji: '⛰️' },
  { id: 'travel_hotel_airbnb', category: 'travel', left: { en: 'Hotel', tr: 'Otel' }, right: { en: 'Airbnb', tr: 'Airbnb' }, leftEmoji: '🏨', rightEmoji: '🏡' },
  { id: 'travel_roadtrip_flight', category: 'travel', left: { en: 'Road Trip', tr: 'Karayolu' }, right: { en: 'Flight', tr: 'Uçak' }, leftEmoji: '🚗', rightEmoji: '✈️' },
  { id: 'travel_europe_usa', category: 'travel', left: { en: 'Europe', tr: 'Avrupa' }, right: { en: 'USA', tr: 'ABD' }, leftEmoji: '🇪🇺', rightEmoji: '🇺🇸' },
  { id: 'travel_summerholiday_skiholiday', category: 'travel', left: { en: 'Summer Holiday', tr: 'Yaz Tatili' }, right: { en: 'Ski Holiday', tr: 'Kayak Tatili' }, leftEmoji: '🏖️', rightEmoji: '⛷️' },
  { id: 'travel_alone_withfriends', category: 'travel', left: { en: 'Travel Alone', tr: 'Tek Başına Gezmek' }, right: { en: 'With Friends', tr: 'Arkadaşlarla Gezmek' }, leftEmoji: '🎒', rightEmoji: '👥' },
  { id: 'travel_explore_relax', category: 'travel', left: { en: 'Explore', tr: 'Keşfetmek' }, right: { en: 'Relax', tr: 'Dinlenmek' }, leftEmoji: '🧭', rightEmoji: '🌴' },

  // ENTERTAINMENT
  { id: 'ent_netflix_youtube', category: 'entertainment', left: { en: 'Netflix', tr: 'Netflix' }, right: { en: 'YouTube', tr: 'YouTube' }, leftEmoji: '🎬', rightEmoji: '▶️' },
  { id: 'ent_movie_series', category: 'entertainment', left: { en: 'Movie', tr: 'Film' }, right: { en: 'Series', tr: 'Dizi' }, leftEmoji: '🎥', rightEmoji: '📺' },
  { id: 'ent_comedy_horror', category: 'entertainment', left: { en: 'Comedy', tr: 'Komedi' }, right: { en: 'Horror', tr: 'Korku' }, leftEmoji: '😂', rightEmoji: '👻' },
  { id: 'ent_action_romance', category: 'entertainment', left: { en: 'Action', tr: 'Aksiyon' }, right: { en: 'Romance', tr: 'Romantik' }, leftEmoji: '💥', rightEmoji: '💕' },
  { id: 'ent_cinema_home', category: 'entertainment', left: { en: 'Cinema', tr: 'Sinema' }, right: { en: 'Watch at Home', tr: 'Evde İzlemek' }, leftEmoji: '🎦', rightEmoji: '🛋️' },
  { id: 'ent_marvel_dc', category: 'entertainment', left: { en: 'Marvel', tr: 'Marvel' }, right: { en: 'DC', tr: 'DC' }, leftEmoji: '🦸', rightEmoji: '🦇' },
  { id: 'ent_spotify_ytmusic', category: 'entertainment', left: { en: 'Spotify', tr: 'Spotify' }, right: { en: 'YouTube Music', tr: 'YouTube Music' }, leftEmoji: '🎧', rightEmoji: '▶️' },
  { id: 'ent_rap_pop', category: 'entertainment', left: { en: 'Rap', tr: 'Rap' }, right: { en: 'Pop', tr: 'Pop' }, leftEmoji: '🎤', rightEmoji: '🎵' },
  { id: 'ent_oldsongs_newsongs', category: 'entertainment', left: { en: 'Old Songs', tr: 'Eski Şarkılar' }, right: { en: 'New Songs', tr: 'Yeni Şarkılar' }, leftEmoji: '📻', rightEmoji: '🆕' },
  { id: 'ent_gaming_movies', category: 'entertainment', left: { en: 'Gaming', tr: 'Oyun Oynamak' }, right: { en: 'Movies', tr: 'Film İzlemek' }, leftEmoji: '🎮', rightEmoji: '🎬' },

  // SPORTS
  { id: 'sports_football_basketball', category: 'sports', left: { en: 'Football', tr: 'Futbol' }, right: { en: 'Basketball', tr: 'Basketbol' }, leftEmoji: '⚽', rightEmoji: '🏀' },
  { id: 'sports_messi_ronaldo', category: 'sports', left: { en: 'Messi', tr: 'Messi' }, right: { en: 'Ronaldo', tr: 'Ronaldo' }, leftEmoji: '⚽', rightEmoji: '⚽' },
  { id: 'sports_clubfootball_nationalteams', category: 'sports', left: { en: 'Club Football', tr: 'Kulüp Futbolu' }, right: { en: 'National Teams', tr: 'Milli Takımlar' }, leftEmoji: '🏟️', rightEmoji: '🏆' },
  { id: 'sports_premierleague_ucl', category: 'sports', left: { en: 'Premier League', tr: 'Premier Lig' }, right: { en: 'Champions League', tr: 'Şampiyonlar Ligi' }, leftEmoji: '🏴', rightEmoji: '⭐' },
  { id: 'sports_watch_play', category: 'sports', left: { en: 'Watch Sports', tr: 'Spor İzlemek' }, right: { en: 'Play Sports', tr: 'Spor Yapmak' }, leftEmoji: '📺', rightEmoji: '🏃' },
  { id: 'sports_gym_football', category: 'sports', left: { en: 'Gym', tr: 'Spor Salonu' }, right: { en: 'Football', tr: 'Futbol' }, leftEmoji: '🏋️', rightEmoji: '⚽' },
  { id: 'sports_attack_defence', category: 'sports', left: { en: 'Attack', tr: 'Hücum' }, right: { en: 'Defence', tr: 'Savunma' }, leftEmoji: '⚔️', rightEmoji: '🛡️' },
  { id: 'sports_worldcup_ucl', category: 'sports', left: { en: 'World Cup', tr: 'Dünya Kupası' }, right: { en: 'Champions League', tr: 'Şampiyonlar Ligi' }, leftEmoji: '🌍', rightEmoji: '⭐' },

  // SPICY
  { id: 'spicy_kiss_hug', category: 'spicy', left: { en: 'Kiss', tr: 'Öpücük' }, right: { en: 'Hug', tr: 'Sarılma' }, leftEmoji: '💋', rightEmoji: '🤗' },
  { id: 'spicy_firstmove_chased', category: 'spicy', left: { en: 'Make the First Move', tr: 'İlk Adımı Atmak' }, right: { en: 'Be Chased', tr: 'Peşinden Koşulmak' }, leftEmoji: '🙋', rightEmoji: '😏' },
  { id: 'spicy_cute_hot', category: 'spicy', left: { en: 'Cute', tr: 'Tatlı' }, right: { en: 'Hot', tr: 'Ateşli' }, leftEmoji: '🥰', rightEmoji: '🔥' },
  { id: 'spicy_flirty_shy', category: 'spicy', left: { en: 'Flirty', tr: 'Flörtöz' }, right: { en: 'Shy', tr: 'Utangaç' }, leftEmoji: '😏', rightEmoji: '😳' },
  { id: 'spicy_situationship_relationship', category: 'spicy', left: { en: 'Situationship', tr: 'Belirsiz İlişki' }, right: { en: 'Relationship', tr: 'Ciddi İlişki' }, leftEmoji: '🤷', rightEmoji: '💑' },
  { id: 'spicy_badtexter_badkisser', category: 'spicy', left: { en: 'Bad Texter', tr: 'Kötü Mesajlaşan' }, right: { en: 'Bad Kisser', tr: 'Kötü Öpüşen' }, leftEmoji: '📵', rightEmoji: '💋' },
  { id: 'spicy_jealous_distant', category: 'spicy', left: { en: 'Jealous Partner', tr: 'Kıskanç Partner' }, right: { en: 'Distant Partner', tr: 'Mesafeli Partner' }, leftEmoji: '😤', rightEmoji: '🥶' },
  { id: 'spicy_datecrush_celebritycrush', category: 'spicy', left: { en: 'Date Your Crush', tr: 'Aşık Olduğun Kişiyle Çıkmak' }, right: { en: 'Celebrity Crush', tr: 'Ünlü Aşkla Çıkmak' }, leftEmoji: '💘', rightEmoji: '🌟' },
  { id: 'spicy_checkphone_neverask', category: 'spicy', left: { en: 'Check Their Phone', tr: 'Telefonuna Bakmak' }, right: { en: 'Never Ask', tr: 'Hiç Sormamak' }, leftEmoji: '📱', rightEmoji: '🙅' },
  { id: 'spicy_tellcrush_keepsecret', category: 'spicy', left: { en: 'Tell Your Crush', tr: 'Aşkını Söylemek' }, right: { en: 'Keep It Secret', tr: 'Sır Olarak Saklamak' }, leftEmoji: '🗣️', rightEmoji: '🤫' },
  { id: 'spicy_chemistry_compatibility', category: 'spicy', left: { en: 'Chemistry', tr: 'Kimya' }, right: { en: 'Compatibility', tr: 'Uyum' }, leftEmoji: '🔥', rightEmoji: '🧩' },
  { id: 'spicy_onegreatlove_lotsofdating', category: 'spicy', left: { en: 'One Great Love', tr: 'Tek Büyük Aşk' }, right: { en: 'Lots of Dating', tr: 'Çok Sayıda Flört' }, leftEmoji: '💞', rightEmoji: '🔀' },

  // RANDOM
  { id: 'random_future_past', category: 'random', left: { en: 'Future', tr: 'Gelecek' }, right: { en: 'Past', tr: 'Geçmiş' }, leftEmoji: '🔮', rightEmoji: '⏮️' },
  { id: 'random_readminds_invisible', category: 'random', left: { en: 'Read Minds', tr: 'Zihin Okumak' }, right: { en: 'Be Invisible', tr: 'Görünmez Olmak' }, leftEmoji: '🧠', rightEmoji: '👻' },
  { id: 'random_fly_teleport', category: 'random', left: { en: 'Fly', tr: 'Uçmak' }, right: { en: 'Teleport', tr: 'Işınlanmak' }, leftEmoji: '🦅', rightEmoji: '✨' },
  { id: 'random_fame_privacy', category: 'random', left: { en: 'Fame', tr: 'Şöhret' }, right: { en: 'Privacy', tr: 'Mahremiyet' }, leftEmoji: '🌟', rightEmoji: '🔒' },
  { id: 'random_neversleep_nevereat', category: 'random', left: { en: 'Never Sleep', tr: 'Hiç Uyumamak' }, right: { en: 'Never Eat', tr: 'Hiç Yememek' }, leftEmoji: '😴', rightEmoji: '🍽️' },
  { id: 'random_nophone_notv', category: 'random', left: { en: 'No Phone', tr: 'Telefonsuz Yaşamak' }, right: { en: 'No TV', tr: 'Televizyonsuz Yaşamak' }, leftEmoji: '📵', rightEmoji: '📺' },
  { id: 'random_losemoney_losephone', category: 'random', left: { en: 'Lose Your Money', tr: 'Parasını Kaybetmek' }, right: { en: 'Lose Your Phone', tr: 'Telefonunu Kaybetmek' }, leftEmoji: '💸', rightEmoji: '📱' },
  { id: 'random_knowfuture_changepast', category: 'random', left: { en: 'Know Your Future', tr: 'Geleceğini Bilmek' }, right: { en: 'Change Your Past', tr: 'Geçmişini Değiştirmek' }, leftEmoji: '🔮', rightEmoji: '⏮️' },
  { id: 'random_100ypast_100yfuture', category: 'random', left: { en: 'Live 100 Years in the Past', tr: '100 Yıl Önce Yaşamak' }, right: { en: '100 Years in the Future', tr: '100 Yıl Sonra Yaşamak' }, leftEmoji: '⏮️', rightEmoji: '⏭️' },
  { id: 'random_lucky_smart', category: 'random', left: { en: 'Be Extremely Lucky', tr: 'Çok Şanslı Olmak' }, right: { en: 'Extremely Smart', tr: 'Çok Zeki Olmak' }, leftEmoji: '🍀', rightEmoji: '🧠' },
  { id: 'random_10minlate_20minearly', category: 'random', left: { en: 'Always Be 10 Minutes Late', tr: 'Her Zaman 10 Dakika Geç Kalmak' }, right: { en: '20 Minutes Early', tr: '20 Dakika Erken Gelmek' }, leftEmoji: '⏰', rightEmoji: '⏱️' },
  { id: 'random_unlimitedmoney_unlimitedtime', category: 'random', left: { en: 'Unlimited Money', tr: 'Sınırsız Para' }, right: { en: 'Unlimited Time', tr: 'Sınırsız Zaman' }, leftEmoji: '💰', rightEmoji: '⏳' },
  { id: 'random_nosocial_nostreaming', category: 'random', left: { en: 'No Social Media', tr: 'Sosyal Medyasız' }, right: { en: 'No Streaming', tr: 'Dizi-Filmsiz' }, leftEmoji: '📵', rightEmoji: '📴' },
  { id: 'random_famousonline_famousreallife', category: 'random', left: { en: 'Famous Online', tr: 'İnternette Ünlü' }, right: { en: 'Famous in Real Life', tr: 'Gerçek Hayatta Ünlü' }, leftEmoji: '💻', rightEmoji: '🌍' },
];

export const getPromptsByCategory = (category: ThisOrThatCategory) => THIS_OR_THAT_PROMPTS.filter((p) => p.category === category);

export const getRandomThisOrThatPrompt = (category?: ThisOrThatCategory, excludeIds: string[] = []) => {
  const pool = THIS_OR_THAT_PROMPTS.filter((p) => (!category || p.category === category) && !excludeIds.includes(p.id));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
};
