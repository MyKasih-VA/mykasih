describe('Authentication (AUTH-01 to AUTH-04)', () => {
  describe('AUTH-01: Sign in with email and password', () => {
    test.todo('calls supabase.auth.signInWithPassword with email and password')
    test.todo('returns user object on successful login')
  })

  describe('AUTH-02: Role-based redirect after sign-in', () => {
    test.todo('redirects admin to /')
    test.todo('redirects mykasih to /')
    test.todo('redirects qmedia to /analytics')
    test.todo('redirects supervisor to /live-monitor')
  })

  describe('AUTH-03: Invalid credentials error display', () => {
    test.todo('shows error message for invalid email or password')
    test.todo('error appears below the Sign In button')
  })

  describe('AUTH-04: Session persistence', () => {
    test.todo('session persists across browser refresh via cookie')
  })
})
