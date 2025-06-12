"use client";

import Link from 'next/link'
import styles from './Doctors.module.css'
import { useEffect, useState } from 'react'

// Явная типизация для врача
type Doctor = {
  doctorID: string;
  surname: string;
  name: string;
  patronymic: string;
  specialization: string;
  education: string;
  progress: string;
  photo?: string;
  rating?: number;
}

export default function AllDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/MyHelp/doctors`)
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные врачей')
        }
        const data = await response.json()
        if (data.status === 'success') {
          setDoctors(data.data)
        }
      } catch (err: any) {
        setError(err?.message || 'Неизвестная ошибка')
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Поликлиника №1</h1>
          <nav className={styles.nav}>
            <Link href="/polyclinic" className={styles.navLink}>Главная</Link>
            <Link href="/polyclinic/auth" className={styles.navLink}>Личный кабинет</Link>
          </nav>
        </div>
      </header>
      
      <main className={styles.main}>
        <div className={styles.heading}>
          <h2 className={styles.title}>Наши врачи</h2>
          <p className={styles.subtitle}>Профессионалы с большим опытом работы</p>
        </div>
        
        {loading ? (
          <p className={styles.loading}>Загрузка данных...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <div className={styles.doctorsGrid}>
            {doctors.length > 0 ? (
              doctors.map(doctor => (
                <div key={doctor.doctorID} className={styles.doctorCard}>
                  <div className={styles.photoContainer}>
                    {doctor.photo ? (
                      <img 
                        src={doctor.photo} 
                        alt={`${doctor.surname} ${doctor.name} ${doctor.patronymic}`}
                        className={styles.doctorPhoto}
                        width={160}
                        height={160}
                      />
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        {doctor.surname?.charAt(0) ?? "?"}{doctor.name?.charAt(0) ?? "?"}
                      </div>
                    )}
                  </div>
                  <h3 className={styles.doctorName}>
                    {doctor.surname} {doctor.name} {doctor.patronymic}
                  </h3>
                  <p className={styles.specialization}>{doctor.specialization}</p>
                  <p className={styles.education}>{doctor.education}</p>
                  <p className={styles.progress}>{doctor.progress}</p>
                  <div className={styles.rating}>
                    Рейтинг: {typeof doctor.rating === 'number' ? doctor.rating.toFixed(1) : "Нет данных"}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.noDoctors}>Нет данных о врачах</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
