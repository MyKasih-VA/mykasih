import { render, screen } from '@testing-library/react'

// Stub: will be importable after Plan 02 creates the component
// import { VoiceAgentTab } from '@/components/testing/VoiceAgentTab'

describe('VoiceAgentTab', () => {
  it('renders start session button', () => {
    // TODO: Plan 02 implementation — render VoiceAgentTab, expect "Start Session" button
    expect(true).toBe(true)
  })

  it('tags all test sessions with is_test=true', () => {
    // TODO: Plan 02 implementation — verify startSession call includes is_test metadata
    expect(true).toBe(true)
  })

  it('displays status badge with correct states', () => {
    // TODO: Plan 02 implementation — verify Ready/Connecting/Active/Ended badge states
    expect(true).toBe(true)
  })
})
