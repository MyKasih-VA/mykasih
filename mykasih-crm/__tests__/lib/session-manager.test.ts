describe('getActiveSession', () => {
  test.todo('returns null when no active session')
  test.todo('returns most recent non-expired session')
  test.todo('ignores expired sessions')
})

describe('createSession', () => {
  test.todo('creates session with wa_phone and language')
  test.todo('sets step to 0 and empty collected_data')
})

describe('updateSession', () => {
  test.todo('updates intent and step')
  test.todo('merges collected_data')
})

describe('expireSession', () => {
  test.todo('sets expires_at to now')
})
