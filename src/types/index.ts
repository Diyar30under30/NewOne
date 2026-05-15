export type Difficulty = 'easy' | 'medium' | 'hard' | 'custom' | 'blitz';
export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';
export type Theme = 'light' | 'dark' | 'contrast';
export type SkinType = 'cell' | 'flag' | 'mine' | 'number' | 'complete';
export type RoomMode = 'duel' | 'coop' | 'battle' | 'league';
export type RealtimeMoveType = 'open' | 'flag' | 'win' | 'lose' | 'ready' | 'chat';
export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type LeagueStage = 'round_of_8' | 'quarter' | 'semi' | 'final';

export interface CellData {
  row: number;
  col: number;
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  isQuestion: boolean;
  neighborCount: number;
  isExploded?: boolean;
  probability?: number;
}

export interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
  label: string;
}

export interface GameState {
  board: CellData[][];
  status: GameStatus;
  difficulty: Difficulty;
  startTime: number | null;
  endTime: number | null;
  flagsPlaced: number;
  minesTotal: number;
  firstClick: boolean;
  seed?: number;
}

export interface Profile {
  id: string;
  username: string;
  email?: string;
  city?: string;
  avatar_url?: string;
  theme: Theme;
  is_pro: boolean;
  pro_expires_at?: string;
  coins: number;
  skin_id?: string;
  created_at: string;
}

export interface Stats {
  user_id: string;
  total_games: number;
  wins: number;
  losses: number;
  best_time_easy?: number;
  best_time_medium?: number;
  best_time_hard?: number;
  longest_win_streak: number;
  current_win_streak: number;
}

export interface GameHistoryEntry {
  id: string;
  user_id: string;
  difficulty: Difficulty;
  seed?: number;
  result: 'win' | 'loss';
  time_ms: number;
  accuracy?: number;
  played_at: string;
  board_snapshot?: string;
}

export interface DailyChallenge {
  date: string;
  seed: number;
  width: number;
  height: number;
  mines: number;
}

export interface DailyResult {
  id: string;
  user_id: string;
  date: string;
  time_ms: number;
  accuracy?: number;
  finished_at: string;
}

export interface Skin {
  id: string;
  name: string;
  type: SkinType;
  price_coins: number;
  price_usd?: number;
  css_class: string;
  preview_url?: string;
  emoji?: string;
  description?: string;
  is_premium?: boolean;
}

export interface UserSkin {
  user_id: string;
  skin_id: string;
  equipped: boolean;
  purchased_at: string;
}

export interface MultiplayerPlayer {
  id: string;
  username: string;
  avatar_url?: string;
  is_ready: boolean;
  progress?: number;
  status?: 'playing' | 'won' | 'lost';
  elo?: number;
  cells_opened?: number;
}

export interface MultiplayerRoom {
  id: string;
  host_id: string;
  mode: RoomMode;
  status: RoomStatus;
  seed: number;
  difficulty: Difficulty;
  players: MultiplayerPlayer[];
  created_at: string;
  is_private: boolean;
  password?: string;
  max_players: number;
  league_id?: string;
  league_stage?: LeagueStage;
  chat_messages?: ChatMessage[];
}

export interface ChatMessage {
  user_id: string;
  username: string;
  text: string;
  sent_at: string;
}

export interface LeagueRoom {
  id: string;
  name: string;
  host_id: string;
  stage: LeagueStage;
  max_players: 8;
  players: MultiplayerPlayer[];
  matches: LeagueMatch[];
  status: 'waiting' | 'in_progress' | 'finished';
  created_at: string;
  is_private: boolean;
  password?: string;
}

export interface LeagueMatch {
  id: string;
  league_id: string;
  stage: LeagueStage;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  room_id?: string;
  status: 'pending' | 'playing' | 'finished';
}

export interface Clan {
  id: string;
  name: string;
  owner_id: string;
  members: ClanMember[];
  weekly_wins: number;
  emoji?: string;
}

export interface ClanMember {
  user_id: string;
  username: string;
  wins: number;
  role: 'owner' | 'member';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  reward_coins: number;
  reward_skin_id?: string;
  condition_type: 'wins' | 'games' | 'streak' | 'time' | 'flags' | 'daily';
  condition_value: number;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  city?: string;
  best_time: number;
  total_wins: number;
  elo?: number;
}

export interface AIHint {
  row: number;
  col: number;
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  isSafest?: boolean;
  isMostDangerous?: boolean;
}

export interface RealtimeMove {
  type: RealtimeMoveType;
  player_id: string;
  row?: number;
  col?: number;
  message?: string;
  cells_opened?: number;
  timestamp: number;
}
