describe('GET /api/webhook/chat', () => {
  test.todo('returns hub.challenge when mode=subscribe and token matches')
  test.todo('returns 403 when token does not match')
  test.todo('returns 403 when mode is not subscribe')
  test.todo('returns 403 when hub.challenge is missing')
})

describe('POST /api/webhook/chat', () => {
  test.todo('returns 401 when n8n secret is missing')
  test.todo('returns 401 when n8n secret is wrong')
  test.todo('extracts text message body from Meta payload')
  test.todo('extracts button_reply title from interactive payload')
  test.todo('returns 200 for status-only webhook events (no messages array)')
  test.todo('deduplicates on wa_message_id (WAMID)')
})
