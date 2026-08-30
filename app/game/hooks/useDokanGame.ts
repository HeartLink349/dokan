'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../core/audio';
import { advanceService, beginNegotiation, createNewGame, customerReady, customerRequests, finishDay, nextCustomer, priceChoice, rejectCustomer, restartDayOne, restockProduct, tickPatience } from '../core/game';
import { clearGame, loadGame, saveGame } from '../core/save';
import type { GameState, PriceChoice, Quality } from '../types';

export function useDokanGame() {
  const [game, setGame] = useState<GameState>(createNewGame);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState('');
  const [selectedPrice, setSelectedPrice] = useState<PriceChoice>('full');
  const audio = useRef<AudioManager | null>(null);

  useEffect(() => {
    const saved = loadGame();
    if (saved?.version === 1) {
      setGame({
        ...saved,
        metrics: { ...saved.metrics, satisfactionTotal: saved.metrics.satisfactionTotal ?? 0 },
      });
    }
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) saveGame(game); }, [game, hydrated]);

  const sound = useCallback((kind: 'click' | 'cash' | 'error') => {
    audio.current ??= new AudioManager();
    audio.current.play(kind, game.audio.master * game.audio.sfx / 100, game.audio.muted);
  }, [game.audio]);

  const announce = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }, []);

  const transition = useCallback((updater: (current: GameState) => GameState, kind: 'click' | 'cash' | 'error' = 'click') => {
    setGame((current) => updater(current));
    sound(kind);
  }, [sound]);

  const open = useCallback(() => {
    transition((current) => nextCustomer({ ...current, phase: 'opening' }));
    announce('🏪 فتحنا الدكان… أول زبون داخل.');
  }, [announce, transition]);

  const choosePrice = useCallback((choice: PriceChoice) => {
    setSelectedPrice(choice);
    transition((current) => priceChoice(current, choice), choice === 'customerOffer' ? 'cash' : 'click');
  }, [transition]);

  const negotiate = useCallback(() => {
    transition(beginNegotiation);
    announce('🤝 الفصال بدأ — اختَر السعر الذي يناسبك.');
  }, [announce, transition]);

  const leave = useCallback(() => transition(rejectCustomer, 'error'), [transition]);
  const closeDay = useCallback(() => transition(finishDay), [transition]);
  const restock = useCallback((productId: string) => {
    transition((current) => restockProduct(current, productId));
    announce('📦 راجع رصيدك؛ تم طلب توريد المنتج إن كانت السيولة كافية.');
  }, [announce, transition]);

  const restart = useCallback(() => {
    clearGame();
    setSelectedPrice('full');
    transition(restartDayOne);
    announce('🔄 بدأ يوم أول جديد بحالة نظيفة.');
  }, [announce, transition]);

  const updateAudio = useCallback((field: 'master' | 'music' | 'sfx' | 'muted', value: number | boolean) => {
    setGame((current) => ({ ...current, audio: { ...current.audio, [field]: value } }));
  }, []);
  const updateQuality = useCallback((quality: Quality) => setGame((current) => ({ ...current, settings: { ...current.settings, quality } })), []);

  useEffect(() => {
    const customer = game.currentCustomer;
    if (!customer || !['ENTERING', 'BROWSING'].includes(customer.state)) return;
    const timer = window.setTimeout(() => setGame(customer.state === 'ENTERING' ? customerReady : customerRequests), GAME_CONFIG.customerEnterMs);
    return () => window.clearTimeout(timer);
  }, [game.currentCustomer]);

  useEffect(() => {
    const customer = game.currentCustomer;
    if (!customer || !['BUYING', 'PAYING'].includes(customer.state)) return;
    const timer = window.setTimeout(() => setGame(advanceService), 310);
    return () => window.clearTimeout(timer);
  }, [game.currentCustomer]);

  useEffect(() => {
    const customer = game.currentCustomer;
    if (!customer || !['SATISFIED', 'LEAVING', 'ANGRY'].includes(customer.state)) return;
    const timer = window.setTimeout(() => setGame(nextCustomer), GAME_CONFIG.customerExitMs);
    return () => window.clearTimeout(timer);
  }, [game.currentCustomer]);

  useEffect(() => {
    if (game.phase !== 'playing') return;
    const timer = window.setInterval(() => setGame(tickPatience), GAME_CONFIG.patienceTickMs);
    return () => window.clearInterval(timer);
  }, [game.phase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'SELECT') return;
      if ((GAME_CONFIG.keybindings.sell as readonly string[]).includes(event.key)) { event.preventDefault(); choosePrice(selectedPrice); }
      if ((GAME_CONFIG.keybindings.negotiate as readonly string[]).includes(event.key)) { event.preventDefault(); negotiate(); }
      if ((GAME_CONFIG.keybindings.priceDown as readonly string[]).includes(event.key)) { event.preventDefault(); setSelectedPrice((choice) => choice === 'full' ? 'smallDiscount' : choice === 'smallDiscount' ? 'customerOffer' : 'full'); }
      if ((GAME_CONFIG.keybindings.priceUp as readonly string[]).includes(event.key)) { event.preventDefault(); setSelectedPrice((choice) => choice === 'full' ? 'customerOffer' : choice === 'smallDiscount' ? 'full' : 'smallDiscount'); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [choosePrice, negotiate, selectedPrice]);

  const lowStockIds = useMemo(() => game.products.filter((product) => product.stock <= GAME_CONFIG.lowStockThreshold).map((product) => product.id), [game.products]);
  return { game, hydrated, toast, selectedPrice, setSelectedPrice, open, choosePrice, negotiate, leave, closeDay, restock, restart, updateAudio, updateQuality, lowStockIds };
}
