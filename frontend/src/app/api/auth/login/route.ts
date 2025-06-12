import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  console.log('[Auth API] Starting login process')
  
  try {
    const { email, password } = await request.json()
    console.log('[Auth API] Login attempt for email:', email)
    console.log('URL:', process.env.INTERNAL_API_URL)

    // 1. Получаем данные пользователя
    const userResponse = await fetch(
        `${process.env.INTERNAL_API_URL}/MyHelp/auth/get-user?email=${encodeURIComponent(email)}`,
        { method: 'GET' }
    )
    const userData = await userResponse.json()

    if (!userResponse.ok || userData.status !== 'success') {
      console.error('[Auth API] User not found')
      return NextResponse.json(
        { status: 'error', message: 'Пользователь не найден' },
        { status: 401 }
      )
    }

    // 2. Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, userData.data.password)
    console.log('[Auth API] Password validation:', isPasswordValid)
    
    if (!isPasswordValid) {
      console.error('[Auth API] Invalid password')
      return NextResponse.json(
        { status: 'error', message: 'Неверный пароль' },
        { status: 401 }
      )
    }

    // 3. Получаем токены
    const authResponse = await fetch(`${process.env.INTERNAL_API_URL}/MyHelp/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: userData.data.password
      }),
    })

    const authData = await authResponse.json()
    console.log('[Auth API] Auth data received:', authData)

    if (!authResponse.ok || authData.status !== 'success') {
      console.error('[Auth API] Token request failed')
      return NextResponse.json(
        { status: 'error', message: 'Ошибка при получении токенов' },
        { status: 500 }
      )
    }

    // 4. Подготовка данных (без expires)
    const clientAuthData = {
      patientID: authData.data.patientID,
      accessToken: authData.data.access_token,
      refreshToken: authData.data.refresh_token
    }

    // 5. Создаём ответ
    const response = NextResponse.json(
      {
        status: 'success',
        message: 'Авторизация успешна',
        data: clientAuthData
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
    // 6. Устанавливаем куки (без expires)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    }

    response.cookies.set('session', JSON.stringify(clientAuthData), cookieOptions)
    response.cookies.set('access_token', authData.data.access_token, cookieOptions)

    console.log('[Auth API] Successfully processed login')
    return response

  } catch (error) {
    console.error('[Auth API] Error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}