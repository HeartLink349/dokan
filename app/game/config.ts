export const GAME_CONFIG = {
  initialCapital: 2400,
  dayOneCustomerCount: 37,
  lowStockThreshold: 3,
  restockAmount: 8,
  patienceTickMs: 2800,
  customerEnterMs: 800,
  customerExitMs: 650,
  saveKey: 'dokan-day1-save-v2',
  keybindings: {
    sell: ['Enter'],
    negotiate: [' '],
    close: ['Escape'],
    priceDown: ['ArrowDown'],
    priceUp: ['ArrowUp'],
  },
} as const;

export const QUALITY_LABELS = { low: 'منخفض', medium: 'متوسط', high: 'عالٍ' } as const;
