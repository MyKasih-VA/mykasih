export interface BalanceResult {
  name: string
  balance: number       // RM amount
  expiry: string        // ISO date string
  nearest_merchant: string
}

/**
 * Mock balance API — returns deterministic fixture.
 * Input: masked IC (e.g. "880512-**-****")
 * In production (v2), this will call the real MyKasih balance API.
 */
export function mockBalanceAPI(_maskedIC: string): BalanceResult {
  return {
    name: 'Penerima SARA',
    balance: 100.00,
    expiry: '2026-12-31',
    nearest_merchant: '99 Speedmart, Jalan Kajang Utama',
  }
}
