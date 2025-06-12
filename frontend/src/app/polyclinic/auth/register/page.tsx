'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Register.module.css'

export default function RegisterPage() {
  const [surname, setSurname] = useState('')
  const [name, setName] = useState('')
  const [patronymic, setPatronymic] = useState('')
  const [polic, setPolic] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!agreed) {
      setError('Для продолжения необходимо принять пользовательское соглашение')
      return
    }
    
    try {
      const response = await fetch('/api/auth/register', {
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
          password 
        }),
      })
      
      if (response.ok) {
        router.push('/polyclinic/auth')
      } else {
        const data = await response.json()
        setError(data.message || 'Ошибка регистрации')
      }
    } catch (err) {
      setError('Произошла ошибка при соединении с сервером')
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Поликлиника №1</h1>
          <nav className={styles.nav}>
            <Link href="/polyclinic" className={styles.navLink}>Главная</Link>
            <Link href="/polyclinic/auth" className={styles.navLink}>Вход</Link>
          </nav>
        </div>
      </header>
      
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.heading}>
            <h2 className={styles.title}>Создайте аккаунт</h2>
            <p className={styles.subtitle}>Заполните форму для регистрации</p>
          </div>
          
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.nameGroup}>
              <div className={styles.formGroup}>
                <label htmlFor="surname" className={styles.label}>
                  Фамилия
                </label>
                <input 
                  type="text" 
                  id="surname" 
                  className={styles.input}
                  placeholder="Иванов"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Имя
                </label>
                <input 
                  type="text" 
                  id="name" 
                  className={styles.input}
                  placeholder="Иван"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="patronymic" className={styles.label}>
                  Отчество
                </label>
                <input 
                  type="text" 
                  id="patronymic" 
                  className={styles.input}
                  placeholder="Иванович"
                  value={patronymic}
                  onChange={(e) => setPatronymic(e.target.value)}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="polic" className={styles.label}>
                Номер полиса ОМС
              </label>
              <input 
                type="text" 
                id="polic" 
                className={styles.input}
                placeholder="1234567890123456"
                value={polic}
                onChange={(e) => setPolic(e.target.value)}
                required
                minLength={16}
                maxLength={16}
              />
            </div>
            
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
                placeholder="Не менее 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <div className={styles.agreement}>
              <div className={styles.checkboxContainer}>
                <input
                  id="agreement"
                  name="agreement"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className={styles.checkbox}
                />
                <label htmlFor="agreement" className={styles.checkboxLabel}>
                  Я принимаю{' '}
                  <button 
                    type="button" 
                    onClick={() => setShowAgreement(!showAgreement)}
                    className={styles.agreementLink}
                  >
                    пользовательское соглашение
                  </button>
                </label>
              </div>
              
              {showAgreement && (
                <div className={styles.agreementText}>
                  <h3 className={styles.agreementTitle}>Пользовательское соглашение</h3>
                  <p>
                    1. Настоящее Соглашение регулирует отношения между Поликлиникой №1 и Пользователем.
                  </p>
                  <p>
                    2. Регистрируясь в системе, Пользователь соглашается предоставлять достоверную информацию.
                  </p>
                  <p>
                    3. Поликлиника обязуется защищать персональные данные Пользователя в соответствии с законодательством.
                  </p>
                  <p>
                    4. Пользователь несет ответственность за сохранность своих учетных данных.
                  </p>
                  <p>
                    5. Поликлиника оставляет за собой право изменять условия соглашения с предварительным уведомлением.
                  </p>
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className={`${styles.button} ${!agreed ? styles.buttonDisabled : ''}`}
              disabled={!agreed}
            >
              Зарегистрироваться
            </button>
          </form>
          
          <div className={styles.loginLink}>
            Уже есть аккаунт?{' '}
            <Link href="/polyclinic/auth" className={styles.loginLinkText}>
              Войдите
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}