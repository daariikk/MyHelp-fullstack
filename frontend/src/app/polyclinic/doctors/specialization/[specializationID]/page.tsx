"use client";

import Link from 'next/link'
import styles from './../../Doctors.module.css'
import { useEffect, useState } from 'react'
import BackButton from '@/components/BackButton'
import { getClientAuthData } from '@/lib/client-auth'

// Типизация для одного врача
type Doctor = {
  doctorID: string
  surname: string
  name: string
  patronymic: string
  specialization: string
  education: string
  progress: string
  photo?: string
  rating?: number
}

export default function SpecializationDoctorsPage({ params }: { params: { specializationID: string } }) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specializationName, setSpecializationName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const authData = getClientAuthData()
    setIsAuthenticated(!!authData?.accessToken)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const doctorsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/MyHelp/specializations/${params.specializationID}`
        )

        if (!doctorsResponse.ok) {
          throw new Error('Не удалось загрузить данные врачей')
        }

        const doctorsData = await doctorsResponse.json()

        if (doctorsData.status === 'success') {
          setDoctors(doctorsData.data)
          if (doctorsData.data.length > 0) {
            setSpecializationName(doctorsData.data[0].specialization ?? '')
          } else {
            setSpecializationName('')
          }
        } else {
          setDoctors([])
          setSpecializationName('')
        }
      } catch (err: any) {
        setError(err?.message || 'Неизвестная ошибка')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.specializationID])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Поликлиника №1</h1>
          <nav className={styles.nav}>
            <Link href="/polyclinic" className={styles.navLink}>Главная</Link>
            <Link
              href={isAuthenticated ? "/polyclinic/auth/account" : "/polyclinic/auth"}
              className={styles.navLink}
            >
              {isAuthenticated ? "Личный кабинет" : "Войти"}
            </Link>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.heading}>
          <h2 className={styles.title}>
            <BackButton />
            {loading
              ? 'Загрузка...'
              : specializationName
                ? `Врачи по специализации: ${specializationName}`
                : 'Наши врачи'}
          </h2>
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
                <Link
                  href={`/polyclinic/doctors/${doctor.doctorID}/schedule`}
                  key={doctor.doctorID}
                  className={styles.doctorCardLink}
                >
                  <div className={styles.doctorCard}>
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
                          {(doctor.surname?.charAt(0) ?? "?")}{doctor.name?.charAt(0) ?? "?"}
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
                      Рейтинг: {typeof doctor.rating === "number" ? doctor.rating.toFixed(1) : "Нет данных"}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className={styles.noDoctors}>
                Нет врачей по выбранной специализации
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
