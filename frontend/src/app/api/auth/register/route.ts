import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { surname, name, patronymic, polic, email, password } = await request.json()
    console.log('Generated hash:', password)
    // Хешируем пароль перед отправкой (так же как при авторизации)
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('Generated hash:', hashedPassword)
    const apiResponse = await fetch(`${process.env.INTERNAL_API_URL}/MyHelp/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        surname,
        name, 
        patronymic,
        polic,
        email,
        password: hashedPassword // Отправляем хешированный пароль
      }),
    })

    const responseData = await apiResponse.json()

    if (!apiResponse.ok || responseData.status !== 'success') {
      return NextResponse.json(
        { 
          status: 'error',
          message: responseData.message || 'Ошибка регистрации'
        },
        { status: apiResponse.status }
      )
    }

    return NextResponse.json({
      status: 'success',
      message: 'Регистрация успешна',
      data: responseData.data
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Ошибка сервера' 
      },
      { status: 500 }
    )
  }
}