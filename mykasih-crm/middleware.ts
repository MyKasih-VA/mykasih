import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check for Supabase session cookie (format: sb-<project-ref>-auth-token)
  const hasSession = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
  )

  if (!hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Only protect dashboard routes — login, api, and _next are excluded
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|login|api/).*)",
  ],
}
