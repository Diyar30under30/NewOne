import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MultiplayerRoom, MultiplayerPlayer, RealtimeMove, ChatMessage } from '../types';
import { generateSeed } from '../lib/utils/gameEngine';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useMultiplayer(userId: string | null) {
  const [rooms, setRooms] = useState<MultiplayerRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [recentMoves, setRecentMoves] = useState<RealtimeMove[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setRooms(data);
    if (error) setError(error.message);
    setLoading(false);
  }, []);

  const createRoom = useCallback(async (
    mode: MultiplayerRoom['mode'],
    difficulty: MultiplayerRoom['difficulty'],
    isPrivate: boolean,
    password?: string,
    maxPlayers = 2
  ) => {
    if (!userId) return null;
    const seed = generateSeed();
    const { data, error } = await supabase
      .from('multiplayer_rooms')
      .insert({
        host_id: userId,
        mode,
        difficulty,
        status: 'waiting',
        seed,
        players: [],
        is_private: isPrivate,
        password: password ?? null,
        max_players: maxPlayers,
      })
      .select()
      .single();
    if (error) { setError(error.message); return null; }
    setCurrentRoom(data);
    return data;
  }, [userId]);

  const joinRoom = useCallback(async (roomId: string, password?: string, playerInfo?: { username: string; avatar_url?: string }) => {
    if (!userId) return false;
    const { data: room } = await supabase
      .from('multiplayer_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!room) return false;
    if (room.is_private && room.password !== password) {
      setError('Неверный пароль');
      return false;
    }
    if ((room.players as unknown[]).length >= room.max_players) {
      setError('Комната заполнена');
      return false;
    }

    // Add this player to the room's players JSONB array in DB
    const newPlayer = {
      id: userId,
      username: playerInfo?.username ?? 'Игрок',
      avatar_url: playerInfo?.avatar_url ?? null,
      is_ready: false,
      status: 'playing',
      cells_opened: 0,
    };
    const updatedPlayers = [...(room.players as unknown[]), newPlayer];
    await supabase
      .from('multiplayer_rooms')
      .update({ players: updatedPlayers })
      .eq('id', roomId);

    setCurrentRoom({ ...room, players: updatedPlayers });
    return true;
  }, [userId]);

  const leaveRoom = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setCurrentRoom(null);
    setRecentMoves([]);
    setChatMessages([]);
  }, []);

  const subscribeToRoom = useCallback((roomId: string, onMove: (move: RealtimeMove) => void) => {
    if (channelRef.current) channelRef.current.unsubscribe();

    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: userId ?? 'guest' } },
    });

    channel
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        const move = payload as RealtimeMove;
        setRecentMoves(prev => [...prev.slice(-50), move]);
        onMove(move);
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        setChatMessages(prev => [...prev.slice(-100), payload as ChatMessage]);
      })
      .on('presence', { event: 'sync' }, () => {
        // presence sync handled via broadcast events
      })
      .subscribe();

    channelRef.current = channel;
    return channel;
  }, [userId]);

  const broadcastMove = useCallback(async (roomId: string, move: Omit<RealtimeMove, 'timestamp'>) => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: 'broadcast',
      event: 'move',
      payload: { ...move, timestamp: Date.now() },
    });
  }, []);

  const sendChatMessage = useCallback(async (roomId: string, text: string, username: string) => {
    if (!channelRef.current || !userId) return;
    const msg: ChatMessage = {
      user_id: userId,
      username,
      text,
      sent_at: new Date().toISOString(),
    };
    await channelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: msg,
    });
    setChatMessages(prev => [...prev.slice(-100), msg]);
  }, [userId, channelRef]);

  const updatePlayerStatus = useCallback(async (
    roomId: string,
    status: 'playing' | 'won' | 'lost',
    cellsOpened?: number
  ) => {
    if (!userId || !channelRef.current) return;
    const type = status === 'playing' ? 'open' : status === 'won' ? 'win' : 'lose';
    await broadcastMove(roomId, {
      type,
      player_id: userId,
      cells_opened: cellsOpened,
    });
  }, [userId, broadcastMove]);

  useEffect(() => {
    return () => {
      if (channelRef.current) channelRef.current.unsubscribe();
    };
  }, []);

  return {
    rooms,
    currentRoom,
    loading,
    error,
    recentMoves,
    chatMessages,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    subscribeToRoom,
    broadcastMove,
    sendChatMessage,
    updatePlayerStatus,
    setError,
  };
}
