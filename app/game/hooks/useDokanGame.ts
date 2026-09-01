'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GAME_CONFIG } from '../config';
import { AudioManager } from '../core/audio';
import { acknowledgeDay2Update, advanceService, beginNegotiation, continueCustomer, createNewGame, customerReady, customerRequests, customerWaits, findAlternative, finishDay, getMarketPrice, nextCustomer, offerAlternative, priceChoice, rejectCustomer, restartDayOne, restockProduct, restoreGame, startNextDay, supplierAction, tickPatience } from '../core/game';
import { clearGame, loadGame, saveGame } from '../core/save';
import type { GameState, PriceChoice, Quality, SupplierChoice } from '../types';

export function useDokanGame() {
  const [game, setGame] = useState<GameState>(createNewGame);
  const [hydrated, setHydrated] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [toast, setToast] = useState('');
  const [selectedPrice, setSelectedPrice] = useState<PriceChoice>('full');
  const audio = useRef<AudioManager | null>(null);
  const nextCustomerTimer = useRef<number | null>(null);

  useEffect(() => {
    const saved = loadGame();
    if (saved) { setGame(restoreGame(saved)); setHasSavedGame(true); }
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
    if (!game.products.some((product) => product.stock > 0)) {
      sound('error');
      announce('🛒 اشترِ منتجات للمخزون الأول قبل فتح الدكان.');
      return;
    }
    transition((current) => nextCustomer({ ...current, phase: 'opening' }));
    announce('🏪 فتحنا الدكان… أول زبون داخل.');
  }, [announce, game.products, sound, transition]);

  const choosePrice = useCallback((choice: PriceChoice) => {
    setSelectedPrice(choice);
    transition((current) => priceChoice(current, choice), choice === 'customerOffer' ? 'cash' : 'click');
  }, [transition]);

  const negotiate = useCallback(() => {
    transition(beginNegotiation);
    announce('🤝 الفصال بدأ — اختَر السعر الذي يناسبك.');
  }, [announce, transition]);

  const leave = useCallback(() => transition(rejectCustomer, 'error'), [transition]);
  const next = useCallback(() => {
    transition(continueCustomer);
    if (nextCustomerTimer.current) window.clearTimeout(nextCustomerTimer.current);
    nextCustomerTimer.current = window.setTimeout(() => transition(nextCustomer), GAME_CONFIG.customerExitMs);
  }, [transition]);

  useEffect(() => () => {
    if (nextCustomerTimer.current) window.clearTimeout(nextCustomerTimer.current);
  }, []);
  const closeDay = useCallback(() => transition(finishDay), [transition]);
  const restock = useCallback((productId: string) => {
    const product = game.products.find((item) => item.id === productId);
    if (!product || product.stock >= product.maxStock) {
      announce('✅ المنتج متوفر بالفعل بالمخزون الكامل.');
      return;
    }
    const amount = Math.min(GAME_CONFIG.restockAmount, product.maxStock - product.stock);
    const bill = amount * getMarketPrice(game, product).cost;
    if (game.money < bill) {
      sound('error');
      announce(`💸 تحتاج ${bill} ج لتوريد ${product.name}.`);
      return;
    }
    transition((current) => restockProduct(current, productId));
    announce(`📦 تم توريد ${amount} من ${product.name} مقابل ${bill} ج.`);
  }, [announce, game.money, game.products, sound, transition]);

  const restart = useCallback(() => {
    clearGame();
    setSelectedPrice('full');
    transition(restartDayOne);
    announce('🔄 بدأ يوم أول جديد بحالة نظيفة.');
  }, [announce, transition]);

  const beginDayTwo = useCallback(() => {
    transition(startNextDay);
    announce('🚀 اليوم الثاني جاهز: راقب السوق قبل ما تجهّز الرفوف.');
  }, [announce, transition]);
  const seeDayTwoUpdate = useCallback(() => transition(acknowledgeDay2Update), [transition]);
  const suggestAlternative = useCallback(() => {
    const alternative = findAlternative(game);
    transition(offerAlternative);
    announce(alternative ? `🔁 عرضت ${alternative.name} كبديل.` : '⚠️ لا يوجد بديل مناسب متاح الآن.');
  }, [announce, game, transition]);
  const negotiateSupplier = useCallback((choice: SupplierChoice) => {
    transition((current) => supplierAction(current, choice), choice === 'decline' ? 'error' : 'click');
  }, [transition]);

  const updateAudio = useCallback((field: 'master' | 'music' | 'sfx' | 'muted', value: number | boolean) => {
    setGame((current) => ({ ...current, audio: { ...current.audio, [field]: value } }));
  }, []);
  const updateQuality = useCallback((quality: Quality) => setGame((current) => ({ ...current, settings: { ...current.settings, quality } })), []);

  useEffect(() => {
    const customer = game.currentCustomer;
    if (!customer || !['ENTERING', 'WAITING', 'BROWSING'].includes(customer.state)) return;
    const nextState = customer.state === 'ENTERING' ? customerReady : customer.state === 'WAITING' ? customerWaits : customerRequests;
    const timer = window.setTimeout(() => setGame(nextState), GAME_CONFIG.customerEnterMs);
    return () => window.clearTimeout(timer);
  }, [game.currentCustomer]);

  useEffect(() => {
    const customer = game.currentCustomer;
    if (!customer || !['BUYING', 'PAYING'].includes(customer.state)) return;
    const timer = window.setTimeout(() => setGame(advanceService), 310);
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
      if ((GAME_CONFIG.keybindings.sell as readonly string[]).includes(event.key)) {
        event.preventDefault();
        if (game.currentCustomer && ['SATISFIED', 'LEAVING', 'ANGRY'].includes(game.currentCustomer.state)) next();
        else choosePrice(selectedPrice);
      }
      if ((GAME_CONFIG.keybindings.negotiate as readonly string[]).includes(event.key)) { event.preventDefault(); negotiate(); }
      if ((GAME_CONFIG.keybindings.priceDown as readonly string[]).includes(event.key)) { event.preventDefault(); setSelectedPrice((choice) => choice === 'full' ? 'smallDiscount' : choice === 'smallDiscount' ? 'customerOffer' : 'full'); }
      if ((GAME_CONFIG.keybindings.priceUp as readonly string[]).includes(event.key)) { event.preventDefault(); setSelectedPrice((choice) => choice === 'full' ? 'customerOffer' : choice === 'smallDiscount' ? 'full' : 'smallDiscount'); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [choosePrice, game.currentCustomer, negotiate, next, selectedPrice]);

  const lowStockIds = useMemo(() => game.products.filter((product) => product.stock > 0 && product.stock <= GAME_CONFIG.lowStockThreshold).map((product) => product.id), [game.products]);
  return { game, hydrated, hasSavedGame, toast, selectedPrice, setSelectedPrice, open, choosePrice, negotiate, leave, next, closeDay, restock, restart, beginDayTwo, seeDayTwoUpdate, suggestAlternative, negotiateSupplier, updateAudio, updateQuality, lowStockIds };
}
