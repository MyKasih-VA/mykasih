describe('POST /api/chatbot/message', () => {
  test.todo('returns 401 without n8n webhook secret')
  test.todo('classifies intent and dispatches to correct handler')
  test.todo('sends first contact list on new session')
  test.todo('uses locked session intent instead of re-classifying')
  test.todo('returns 500 on unhandled error')
})
