// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json(
    { status: 'success', message: 'Logged out' }
  )
  
  response.cookies.delete('session')
  response.cookies.delete('access_token')
  
  return response
}