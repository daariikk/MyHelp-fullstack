'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Auth.module.css'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка авторизации')
      }

      localStorage.setItem('auth', JSON.stringify(data.data))
      router.push('/polyclinic/auth/account')
      
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка соединения')
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Поликлиника №1</h1>
          <nav className={styles.nav}>
            <Link href="/polyclinic" className={styles.navLink}>Главная</Link>
          </nav>
        </div>
      </header>
      
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.heading}>
            <h2 className={styles.title}>Вход в личный кабинет</h2>
            <p className={styles.subtitle}>Введите ваши учетные данные</p>
          </div>
          
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input 
                type="email" 
                id="email" 
                className={styles.input}
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Пароль
              </label>
              <input 
                type="password" 
                id="password" 
                className={styles.input}
                placeholder="Введите ваш пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className={styles.button}>
              Войти
            </button>
          </form>
          
          <div className={styles.registerLink}>
            Нет аккаунта?{' '}
            <Link href="/polyclinic/auth/register" className={styles.registerLinkText}>
              Зарегистрируйтесь
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}