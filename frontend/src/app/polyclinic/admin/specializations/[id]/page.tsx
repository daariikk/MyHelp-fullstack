'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import styles from './Doctor.module.css'

interface Doctor {
  doctorID: number
  surname: string
  name: string
  patronymic: string
  specialization: string
  education: string
  progress: string
  rating: number
  photo: string | null
}

export default function SpecializationDoctors() {
  const { id } = useParams()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewImage, setPreviewImage] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState<number | null>(null)
  const [newDoctor, setNewDoctor] = useState({ surname: '', name: '', patronymic: '', specialization: '', education: '', progress: '', photo: '' })
  const [newSchedule, setNewSchedule] = useState({ date: '', start_time: '', end_time: '', reception_time: '' })
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const getAuthToken = () => localStorage.getItem('adminToken')

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/MyHelp/specializations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Ошибка при загрузке врачей')

      const data = await response.json()
      setDoctors(data.status === 'success' ? data.data || [] : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => { if (reader.readyState === 2) setPreviewImage(reader.result as string) }
    reader.readAsDataURL(file)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (uploadRes.ok) {
        const { filePath } = await uploadRes.json()
        setNewDoctor(prev => ({ ...prev, photo: filePath }))
      } else throw new Error('Ошибка загрузки изображения')
    } catch (err) {
      setError('Не удалось загрузить изображение')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteDoctor = async (doctorID: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого врача?')) return

    try {
      const token = getAuthToken()
      const doctorToDelete = doctors.find(d => d.doctorID === doctorID)
      if (!doctorToDelete) throw new Error('Врач не найден')

      if (doctorToDelete.photo && doctorToDelete.photo !== '/doctors/default.jpg') {
        try {
          const photoPath = getDoctorPhotoPath(doctorToDelete.photo)
          await fetch('/api/photo/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ photoPath })
          })
        } catch (photoError) {
          console.error('Ошибка при удалении фото:', photoError)
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/MyHelp/doctors/${doctorID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Ошибка при удалении врача')
      fetchDoctors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении')
    }
  }

  const handleAddDoctor = async () => {
    if (!newDoctor.surname || !newDoctor.name || !newDoctor.specialization) {
      setError('Заполните обязательные поля')
      return
    }

    try {
      const token = getAuthToken()
      if (!token) throw new Error('Требуется авторизация')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/MyHelp/doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newDoctor)
      })

      const contentType = response.headers.get('Content-Type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        throw new Error('Ожидался JSON, но получен: ' + contentType)
      }

      const data = await response.json()
      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Ошибка при добавлении врача')
      }

      setShowAddForm(false)
      setNewDoctor({ surname: '', name: '', patronymic: '', specialization: '', education: '', progress: '', photo: '' })
      setError('')
      fetchDoctors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении')
    }
  }

  const handleAddSchedule = async (doctorID: number) => {
    if (!newSchedule.date || !newSchedule.start_time || !newSchedule.end_time || !newSchedule.reception_time) {
      setError('Заполните все поля расписания')
      return
    }

    try {
      const token = getAuthToken()

      const formatTime = (time: string) => {
        if (!time.includes(':')) return `${time}:00:00`
        const parts = time.split(':')
        return parts.length === 2 ? `${time}:00` : time
      }

      const params = new URLSearchParams()
      params.append('date', newSchedule.date)
      params.append('start_time', formatTime(newSchedule.start_time))
      params.append('end_time', formatTime(newSchedule.end_time))
      params.append('reception_time', newSchedule.reception_time)

      const url = `${process.env.NEXT_PUBLIC_API_URL}/MyHelp/schedule/doctors/${doctorID}?${params.toString()}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Ошибка при добавлении расписания')
      }

      setShowScheduleForm(null)
      setNewSchedule({ date: '', start_time: '', end_time: '', reception_time: '' })
      fetchDoctors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении расписания')
    }
  }

  const getDoctorPhotoPath = (photoPath: string | null) => {
    if (!photoPath) return '/doctors/default.jpg'
    return photoPath.startsWith('/') ? photoPath : `/${photoPath}`
  }

  useEffect(() => {
    fetchDoctors()
  }, [id])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        
        <h1 className={styles.title}>
          Врачи специализации: {doctors[0]?.specialization || 'Загрузка...'}
        </h1>
        
      </header>
      

      

      <main className={styles.main}>
        <button 
          onClick={() => router.push('/polyclinic/admin')}
          className={styles.backButton}
        >
          ← Назад к специализациям
        </button>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={styles.addButton}
        >
          {showAddForm ? 'Отмена' : '+ Добавить врача'}
        </button>
        {showAddForm && (
        <div className={styles.formContainer}>
          <h2>Добавить нового врача</h2>
          <div className={styles.formGroup}>
            <label>Фамилия*:</label>
            <input
              type="text"
              value={newDoctor.surname}
              onChange={(e) => setNewDoctor({...newDoctor, surname: e.target.value})}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Имя*:</label>
            <input
              type="text"
              value={newDoctor.name}
              onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Отчество:</label>
            <input
              type="text"
              value={newDoctor.patronymic}
              onChange={(e) => setNewDoctor({...newDoctor, patronymic: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Специализация*:</label>
            <input
              type="text"
              value={newDoctor.specialization}
              onChange={(e) => setNewDoctor({...newDoctor, specialization: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Образование*:</label>
            <input
              type="text"
              value={newDoctor.education}
              onChange={(e) => setNewDoctor({...newDoctor, education: e.target.value})}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Достижения:</label>
            <textarea
              value={newDoctor.progress}
              onChange={(e) => setNewDoctor({...newDoctor, progress: e.target.value})}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Фотография
              <div className={styles.photoUpload}>
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Превью" 
                    className={styles.previewImage}
                  />
                ) : (
                  <div className={styles.placeholder}>
                    {newDoctor.photo === '/doctors/default.jpg' 
                      ? 'Будет использовано фото по умолчанию' 
                      : 'Загрузите фото врача'}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className={styles.fileInput}
                />
    
              </div>
            </label>
          </div>
          
          
          <div className={styles.formActions}>
            <button onClick={handleAddDoctor} className={styles.submitButton}>
              Добавить врача
            </button>
          </div>
        </div>
      )}
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
                        src={getDoctorPhotoPath(doctor.photo)}
                        alt={`${doctor.surname} ${doctor.name} ${doctor.patronymic}`}
                        className={styles.doctorPhoto}
                        width={160}
                        height={160}
                        onError={(e) => {
                            // Если фото не загрузилось, показываем заглушку
                            const target = e.target as HTMLImageElement;
                            target.src = '/doctors/default.jpg';
                          }}
                      />
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        {doctor.surname.charAt(0)}{doctor.name.charAt(0)}
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
                    Рейтинг: {doctor.rating.toFixed(1)}
                  </div>
                  
                  <div className={styles.actions}>
                    <button 
                      onClick={() => setShowScheduleForm(showScheduleForm === doctor.doctorID ? null : doctor.doctorID)}
                      className={styles.scheduleButton}
                    >
                      {showScheduleForm === doctor.doctorID ? 'Скрыть' : 'Добавить расписание'}
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDoctor(doctor.doctorID)
                      }}
                      className={styles.deleteButton}
                    >
                      Удалить
                    </button>
                  </div>

                  {showScheduleForm === doctor.doctorID && (
                    <div className={styles.scheduleForm}>
                      <h4>Добавить расписание</h4>
                      <div className={styles.formGroup}>
                        <label>Дата:</label>
                        <input
                          type="date"
                          value={newSchedule.date}
                          onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Начало приема:</label>
                        <input
                          type="time"
                          value={newSchedule.start_time}
                          onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Конец приема:</label>
                        <input
                          type="time"
                          value={newSchedule.end_time}
                          onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Длительность приема (мин):</label>
                        <input
                          type="number"
                          value={newSchedule.reception_time}
                          onChange={(e) => setNewSchedule({...newSchedule, reception_time: e.target.value})}
                          min="10"
                          max="120"
                          required
                        />
                      </div>
                      <button 
                        onClick={() => handleAddSchedule(doctor.doctorID)}
                        className={styles.submitButton}
                      >
                        Сохранить расписание
                      </button>
                    </div>
                  )}
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