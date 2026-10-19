/**
 * Canonical bank identifiers supported by the Lanka Offers ingestion engine.
 * The public API returns the lowercase `code` on offers (`bank: "hnb"`);
 * display names come from here so cards never show a raw code.
 */
export interface BankInfo {
  code: string
  name: string
  short: string
}

export const BANKS: readonly BankInfo[] = [
  { code: 'hnb', name: 'Hatton National Bank', short: 'HNB' },
  { code: 'boc', name: 'Bank of Ceylon', short: 'BOC' },
  { code: 'peoples', name: "People's Bank", short: 'PB' },
  { code: 'nsb', name: 'National Savings Bank', short: 'NSB' },
  { code: 'sampath', name: 'Sampath Bank', short: 'SB' },
  { code: 'seylan', name: 'Seylan Bank', short: 'SYL' },
  { code: 'ndb', name: 'NDB Bank', short: 'NDB' },
  { code: 'dfcc', name: 'DFCC Bank', short: 'DFCC' },
  { code: 'pabc', name: 'Pan Asia Bank', short: 'PABC' },
  { code: 'combank', name: 'Commercial Bank', short: 'ComBank' },
]

const BY_CODE = new Map(BANKS.map((b) => [b.code, b]))

export function getBankInfo(codeOrName?: string | null): BankInfo | null {
  if (!codeOrName) return null
  const key = codeOrName.trim().toLowerCase()
  return BY_CODE.get(key) ?? BANKS.find((b) => b.name.toLowerCase() === key) ?? null
}

export function getBankName(codeOrName?: string | null): string {
  if (!codeOrName) return ''
  return getBankInfo(codeOrName)?.name ?? codeOrName
}
