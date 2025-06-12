import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Файл не получен' },
        { status: 400 }
      )
    }

    // Создаем папку doctors если ее нет
    const uploadDir = path.join(process.cwd(), 'public', 'doctors')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const filename = `doctor_${timestamp}${ext}`
    const filePath = path.join(uploadDir, filename)
    const relativePath = `/doctors/${filename}`

    // Сохраняем файл
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    return NextResponse.json({ 
      success: true,
      filePath: relativePath
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Ошибка загрузки файла' },
      { status: 500 }
    )
  }
}