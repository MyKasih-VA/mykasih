import { NextResponse, type NextRequest } from "next/server"

// Next.js 16: Middleware is renamed to Proxy (proxy.ts). Runs on Node.js runtime.
// https://nextjs.org/docs/app/api-reference/file-conventions/proxy

export function proxy(request: NextRequest) {
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
  // Protect dashboard routes — exclude login, api, and _next
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|login|api/).*)",
  ],
}
