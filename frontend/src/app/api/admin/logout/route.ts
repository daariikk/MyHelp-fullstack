import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookiesStore = await cookies();
  cookiesStore.delete('adminAuth')
  return NextResponse.json({ status: 'success' })
}
