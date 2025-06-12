import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const API_BASE_URL = `${process.env.INTERNAL_API_URL}`

export async function POST(request: Request) {
  try {
    // Проверяем Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { status: 'error', message: 'Неверный Content-Type' },
        { status: 400 }
      )
    }

    // Парсим JSON
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { status: 'error', message: 'Невалидный JSON' },
        { status: 400 }
      )
    }

    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Необходимы email и password' },
        { status: 400 }
      )
    }

    // Логи для разработки - введённые данные
    console.log('=== ДЕБАГ ИНФОРМАЦИЯ ===')
    console.log('Введённый email:', email)
    console.log('Введённый пароль (plain text):', password)
    console.log('========================')
    
    // 1. Получаем данные админа с бекенда
    const adminResponse = await fetch(
      `${API_BASE_URL}/MyHelp/auth/get-admin?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
    console.log('=== ДЕБАГ ИНФОРМАЦИЯ ===')
    console.log('Данные с бэка получены')
    console.log('========================')
    if (!adminResponse.ok) {
      return NextResponse.json(
        { status: 'error', message: 'Ошибка при запросе данных администратора' },
        { status: 401 }
      )
    }

    const adminData = await adminResponse.json()
    console.log('=== ДЕБАГ ИНФОРМАЦИЯ ===')
    console.log('adminData', adminData)
    console.log('========================')

    if (adminData.status !== 'success') {
      return NextResponse.json(
        { status: 'error', message: 'Администратор не найден или неактивен' },
        { status: 401 }
      )
    }

    // Логи для разработки - данные из БД
    console.log('=== ДЕБАГ ИНФОРМАЦИЯ ===')
    console.log('Данные администратора из БД:', {
      id: adminData.data.adminID,
      email: adminData.data.email,
      isActive: adminData.data.isActive
    })
    console.log('Хеш пароля из БД:', adminData.data.password)
    console.log('========================')

    // 2. Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, adminData.data.password)
    
    // Лог результата проверки пароля
    console.log('=== ДЕБАГ ИНФОРМАЦИЯ ===')
    console.log('Результат проверки пароля:', isPasswordValid ? 'VALID' : 'INVALID')
    console.log('========================')
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { status: 'error', message: 'Неверные учетные данные' },
        { status: 401 }
      )
    }

    // 3. Получаем токены от бекенда
    const authResponse = await fetch(`${API_BASE_URL}/MyHelp/auth/signup/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: adminData.data.password // Отправляем хеш из первого запроса
      })
    })

    if (!authResponse.ok) {
      return NextResponse.json(
        { status: 'error', message: 'Ошибка при получении токенов' },
        { status: 500 }
      )
    }

    const authData = await authResponse.json()

    // Логи для разработки - полученные токены
    console.log('=== ДЕБАГ ИНФОРМАЦИЯ ===')
    console.log('Полученные токены:', {
      accessToken: authData.data.access_token,
      refreshToken: authData.data.refresh_token,
      accessExpires: authData.data.access_lifetime,
      refreshExpires: authData.data.refresh_lifetime
    })
    console.log('========================')

    // Формируем ответ с токенами
    const response = NextResponse.json({
      status: 'success',
      data: {
        id: adminData.data.adminID,
        email: adminData.data.email,
        accessToken: authData.data.access_token,
        refreshToken: authData.data.refresh_token
      }
    })

    // Устанавливаем куки
    response.cookies.set('adminAuth', authData.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(authData.data.access_lifetime)
    })

    response.cookies.set('adminRefresh', authData.data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(authData.data.refresh_lifetime)
    })

    return response
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}