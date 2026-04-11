/**
 * Masks a Malaysian IC number to PDPA-compliant format.
 * Input:  "880512123456" or "880512-12-3456"
 * Output: "880512-**-****"
 *
 * Returns "??????-**-****" for invalid input — never throws.
 */
export function maskIC(ic: string): string {
  const digits = ic.replace(/-/g, '')

  if (digits.length !== 12 || !/^\d{12}$/.test(digits)) {
    return '??????-**-****'
  }

  const dob = digits.substring(0, 6)
  return `${dob}-**-****`
}
