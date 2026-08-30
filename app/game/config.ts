export const GAME_CONFIG = {
  dayOneCustomerCount: 37,
  lowStockThreshold: 3,
  restockAmount: 8,
  patienceTickMs: 2800,
  customerEnterMs: 460,
  customerExitMs: 650,
  saveKey: 'dokan-day1-save-v1',
  keybindings: {
    sell: ['Enter'],
    negotiate: [' '],
    close: ['Escape'],
    priceDown: ['ArrowDown'],
    priceUp: ['ArrowUp'],
  },
} as const;

export const QUALITY_LABELS = { low: 'منخفض', medium: 'متوسط', high: 'عالٍ' } as const;
