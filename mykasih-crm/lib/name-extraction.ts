/**
 * Extracts caller name from ElevenLabs transcript turns.
 * Used as fallback when ElevenLabs data_collection 'caller_name' field is null.
 *
 * Handles common BM and EN name introduction patterns.
 * Returns null if no name pattern is found — never guesses.
 */

interface TranscriptTurn {
  role: 'agent' | 'user'
  message: string | null
}

// BM patterns: "nama saya Ahmad", "nama ialah Ahmad", "saya Ahmad"
// EN patterns: "my name is Ahmad", "I'm Ahmad", "I am Ahmad"
// Limits match to 40 chars to avoid capturing entire sentences
const NAME_PATTERNS: RegExp[] = [
  /\bnama\s+(?:saya\s+)?(?:ialah\s+|adalah\s+)?([A-Za-z][A-Za-z\s]{1,39})/i,
  /\bsaya\s+(?:bernama\s+)?([A-Z][A-Za-z\s]{1,39})/,   // capital-letter heuristic for BM
  /\bmy\s+name\s+is\s+([A-Za-z][A-Za-z\s]{1,39})/i,
  /\bi(?:'m| am)\s+([A-Z][A-Za-z\s]{1,39})/,            // capital-letter heuristic for EN
]

// Words that indicate the match captured a phrase, not a name — discard these
const FALSE_POSITIVE_WORDS = [
  'calling', 'here', 'from', 'just', 'not', 'sure', 'sorry',
  'panggil', 'hubungi', 'tanya', 'nak', 'mahu', 'ingin',
]

export function extractNameFromTranscript(
  transcript: TranscriptTurn[]
): string | null {
  const userMessages = transcript
    .filter((t) => t.role === 'user' && t.message)
    .map((t) => t.message as string)

  for (const msg of userMessages) {
    for (const pattern of NAME_PATTERNS) {
      const match = msg.match(pattern)
      if (!match) continue

      const candidate = match[1].trim()
      const firstWord = candidate.split(' ')[0].toLowerCase()

      // Discard if first word is a common false-positive
      if (FALSE_POSITIVE_WORDS.includes(firstWord)) continue

      // Discard if result is too short (single char) or suspiciously long
      if (candidate.length < 2 || candidate.length > 60) continue

      // Trim trailing common filler words ("Ahmad lah", "Siti kan")
      const cleaned = candidate.replace(/\s+(?:lah|kan|pun|je|juga|ya)$/i, '').trim()

      return cleaned
    }
  }

  return null
}
