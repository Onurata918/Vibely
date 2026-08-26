export type PersonState = 'online' | 'busy' | 'game';

export type Person = {
  id: string;
  name: string;
  status: string;
  mood: string;
  state: PersonState;
  c1: string;
  c2: string;
  btn: string;
};

export type Room = {
  id: string;
  name: string;
  icon: string;
  owner: string;
  locked: boolean;
  members: string[];
  grad: string;
};

export type RankItem = {
  id: string;
  n: string;
  e: string;
  photo: string | null;
};

export type RankGameName =
  | 'Yemek Sıralama'
  | 'Dizi Sıralama'
  | 'Ülke Sıralama'
  | 'Tüm Zamanların En İyileri'
  | '2026 En İyi Oyuncular'
  | 'Türk Yemekleri'
  | 'Takım Sıralama'
  | 'İçecek Sıralama';

export type CallParticipant = {
  id: string;
  name: string;
  c1: string;
  c2: string;
  mic: boolean;
  cam: boolean;
  bg: string;
};

export type ChatMessage = {
  who: string;
  txt: string;
  t: string;
  me?: boolean;
  sys?: boolean;
  react?: string | null;
};

export type CallTarget = {
  kind: 'user' | 'room';
  id: string;
  title: string;
  members?: string[];
};

export type CallSession = {
  kind: 'user' | 'room';
  id: string;
  title: string;
  started: number;
  parts: CallParticipant[];
  msgs: ChatMessage[];
};

export type HistoryItem = {
  id: string | null;
  title: string;
  kind: 'user' | 'room';
  dur: string;
  at: number;
};

export type Account = {
  username: string;
  name: string;
  email: string;
  password: string;
};

export type CurrentUser = {
  username: string;
  name: string;
  email: string;
};
