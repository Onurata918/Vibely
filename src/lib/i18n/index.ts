import { auth } from './dictionaries/auth';
import { common } from './dictionaries/common';
import { home } from './dictionaries/home';
import { callChrome } from './dictionaries/callChrome';
import { socialGamesDict } from './dictionaries/games/social';
import { wordGamesDict } from './dictionaries/games/wordGames';
import { drawQuizOkeyDict } from './dictionaries/games/drawQuizOkey';
import { exposeMeDict } from './dictionaries/games/exposeMe';
import { fiveSecondDict } from './dictionaries/games/fiveSecond';
import { rankAndYuzbirDict } from './dictionaries/games/rankAndYuzbir';
import { thisOrThatDict } from './dictionaries/games/thisOrThat';
import { whosMostDict } from './dictionaries/games/whosMost';

export type Language = 'en' | 'tr';

function merge(...dicts: { en: object; tr: object }[]) {
  return {
    en: Object.assign({}, ...dicts.map((d) => d.en)),
    tr: Object.assign({}, ...dicts.map((d) => d.tr)),
  };
}

export const dictionary = merge(
  common,
  auth,
  home,
  callChrome,
  socialGamesDict,
  wordGamesDict,
  drawQuizOkeyDict,
  rankAndYuzbirDict,
  whosMostDict,
  thisOrThatDict,
  fiveSecondDict,
  exposeMeDict
);

export type TranslationKey = keyof typeof dictionary.en;
