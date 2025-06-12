import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isAdminPath = path.startsWith('/polyclinic/admin')
  const isAuthPath = path === '/polyclinic/admin/auth'

  // Для админских роутов проверяем авторизацию
  if (isAdminPath && !isAuthPath) {
    const accessToken = request.cookies.get('adminAuth')
    
    if (!accessToken) {
      const url = request.nextUrl.clone()
      url.pathname = '/polyclinic/admin/auth'
      return NextResponse.redirect(url)
    }

    // Дополнительно можно добавить проверку срока действия токена
    // и автоматическое обновление через refresh token
  }

  return NextResponse.next()
}