// polyclinic/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Admin.module.css'
import SpecializationCard from '@/components/SpecializationCard'

interface Specialization {
  specializationID: number
  specialization: string
  specialization_doctor: string
  description: string
}

export default function AdminDashboard() {
  const [specializations, setSpecializations] = useState<Specialization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSpec, setNewSpec] = useState({
    specialization: '',
    specialization_doctor: '',
    description: ''
  })
  const router = useRouter()
  const getAuthToken = () => {
    return localStorage.getItem('adminToken')
  }



  // Получение списка специализаций
  const fetchSpecializations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/MyHelp/specializations`)
    console.log('Сырые данные:', response)
  //const data = JSON.parse(raw)

      if (!response.ok) {
        throw new Error('Ошибка при загрузке специализаций')
      }
      
      const data = await response.json()
      if (data.status === 'success') {
        setSpecializations(data.data)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  // Удаление специализации
  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту специализацию?')) return
    
    const token = getAuthToken()
  

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/MyHelp/specializations/${id}`,
        { method: 'DELETE' ,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
  

      if (!response.ok) {
        throw new Error('Ошибка при удалении')
      }
      
      // Обновляем список после удаления
      fetchSpecializations()
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка при удалении')
    }
  }

  // Добавление новой специализации
  const handleAdd = async () => {
    if (!newSpec.specialization || !newSpec.specialization_doctor) {
      setError('Заполните обязательные поля')
      return
    }
    
const token = getAuthToken()
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/MyHelp/specializations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newSpec)
        }
      )

      
      
      if (!response.ok) {
        throw new Error('Ошибка при добавлении')
      }
      
      // Закрываем форму и обновляем список
      setShowAddForm(false)
      setNewSpec({
        specialization: '',
        specialization_doctor: '',
        description: ''
      })
      fetchSpecializations()
    } catch (err) {
      console.error('Add error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении')
    }
  }

  // Переход к врачам специализации
  const handleCardClick = (id: number) => {
    router.push(`/polyclinic/admin/specializations/${id}`)
  }

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      router.push('/polyclinic/admin/auth')
    } else {
      fetchSpecializations()
    }
  }, [router])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Админ-панель</h1>

        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeCard}>
          <div className={styles.welcomeHeader}>
            <h2 className={styles.welcomeTitle}>Управление специализациями</h2>
            <p className={styles.welcomeSubtitle}>Добавляйте, редактируйте и удаляйте специализации</p>
          </div>
          <nav className={styles.nav}>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className={styles.navLink}
            >
              {showAddForm ? 'Отмена' : 'Добавить специализацию'}
            </button>
          </nav>
          {showAddForm && (
            <div className={styles.infoSection}>
              <h3 className={styles.infoTitle}>Добавить новую специализацию</h3>
              <div className={styles.formGroup}>
                <label>Название специализации:</label>
                <input
                  type="text"
                  value={newSpec.specialization}
                  onChange={(e) => setNewSpec({...newSpec, specialization: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Название врача:</label>
                <input
                  type="text"
                  value={newSpec.specialization_doctor}
                  onChange={(e) => setNewSpec({...newSpec, specialization_doctor: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Описание:</label>
                <textarea
                  value={newSpec.description}
                  onChange={(e) => setNewSpec({...newSpec, description: e.target.value})}
                />
              </div>
              <div className={styles.formActions}>
                <button onClick={handleAdd} className={styles.submitButton}>
                  Добавить
                </button>
              </div>
            </div>
          )}

          <section className={styles.specializations}>
            <div className={styles.specContainer}>
              <h2 className={styles.specSectionTitle}>Специализации</h2>
              {loading ? (
                <p className={styles.loading}>Загрузка данных...</p>
              ) : error ? (
                <p className={styles.error}>Ошибка: {error}</p>
              ) : (
                <div className={styles.grid}>
                  {specializations.length > 0 ? (
                    specializations.map((spec) => (
                      <div 
                        key={spec.specializationID} 
                        className={styles.specCard}
                        onClick={() => handleCardClick(spec.specializationID)}
                      >
                        <h3 className={styles.specTitle}>{spec.specialization}</h3>
                        <p className={styles.specDoctor}>Врач: {spec.specialization_doctor}</p>
                        <p className={styles.specDescription}>Описание: {spec.description}</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(spec.specializationID)
                          }}
                          className={styles.deleteButton}
                        >
                          Удалить
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className={styles.noData}>Специализации не найдены</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}