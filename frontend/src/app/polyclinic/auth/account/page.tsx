'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getClientAuthData, clientLogout } from '@/lib/client-auth'
import Link from 'next/link'
import styles from './Account.module.css'

interface Appointment {
  id: number
  doctor_fio: string
  doctor_specialization: string
  date: string
  time: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELED'
  rating?: number
}

interface PatientData {
  patientID: number
  surname: string
  name: string
  patronymic: string
  polic: string
  email: string
  is_deleted: boolean
  appointments: Appointment[]
}

interface RatingState {
  [key: number]: number | null; // appointmentID: rating
}



export default function AccountPage() {
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [ratingState, setRatingState] = useState<RatingState>({});
  const [activeRatingId, setActiveRatingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [editData, setEditData] = useState({
    surname: '',
    name: '',
    patronymic: '',
    polic: '',
    email: ''
  })
  const [fieldErrors, setFieldErrors] = useState({
  surname: { hasError: false, message: '' },
  name: { hasError: false, message: '' },
  polic: { hasError: false, message: '' },
  email: { hasError: false, message: '' }
});
  const router = useRouter()
  const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};


  useEffect(() => {
  console.log('Field errors updated:', fieldErrors);
}, [fieldErrors]);
useEffect(() => {
  if (isEditing) {
    validateFields();
  }
}, [editData, isEditing]);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // 1. Проверяем авторизацию на клиенте
        const authData = getClientAuthData()
        
        if (!authData) {
          router.push('/polyclinic/auth')
          return
        }
        console.log('URL:', process.env.NEXT_PUBLIC_API_URL)
        // 2. Загружаем данные пациента
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/MyHelp/account?patientID=${authData.patientID}`,
          {
            headers: {
              'Authorization': `Bearer ${authData.accessToken}`
            }
          }
        )
        
        if (!response.ok) {
          console.log('Не пришел корректный ответ')
          throw new Error(`Не удалось загрузить данные: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.status === 'success') {
          setPatientData(data.data)
        } else {
          throw new Error(data.message || 'Ошибка загрузки данных')
        }
      } catch (err) {
        console.error('Failed to fetch patient data:', err)
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        
        // Если ошибка 401 - разлогиниваем
        if (err instanceof Error && err.message.includes('401')) {
          clientLogout()
          router.push('/polyclinic/auth')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPatientData()
  }, [router])

  const handleLogout = () => {
    clientLogout()
    router.push('/polyclinic/auth')
  }

const validateFields = () => {
  const newErrors = {
    surname: {
      hasError: !editData.surname.trim(),
      message: !editData.surname.trim() ? 'Фамилия обязательна' : ''
    },
    name: {
      hasError: !editData.name.trim(),
      message: !editData.name.trim() ? 'Имя обязательно' : ''
    },
    polic: {
      hasError: !editData.polic.trim(),
      message: !editData.polic.trim() ? 'Номер полиса обязателен' : ''
    },
    email: {
      hasError: !editData.email.trim() || !validateEmail(editData.email),
      message: !editData.email.trim() 
        ? 'Email обязателен' 
        : !validateEmail(editData.email)
          ? 'Некорректный формат email' 
          : ''
    }
  };

  setFieldErrors(newErrors);
  return !Object.values(newErrors).some(error => error.hasError);
};

  const filteredAppointments = patientData?.appointments?.filter(appointment => {
    if (activeTab === 'all') return true;
    if (activeTab === 'scheduled') return appointment.status === 'SCHEDULED';
    if (activeTab === 'completed') return appointment.status === 'COMPLETED';
    return true;
  }) || [];

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    }
    return new Date(dateString).toLocaleDateString('ru-RU', options)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return styles.statusScheduled
      case 'COMPLETED': return styles.statusCompleted
      case 'CANCELED': return styles.statusCanceled
      default: return ''
    }
  }

  const handleEditClick = () => {
    if (patientData) {
      setEditData({
        surname: patientData.surname,
        name: patientData.name,
        patronymic: patientData.patronymic,
        polic: patientData.polic,
        email: patientData.email
      })
      setIsEditing(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setEditData(prev => ({ ...prev, [name]: value }));
  
  // Сбрасываем ошибку при вводе
  if (fieldErrors[name as keyof typeof fieldErrors].hasError) {
    setFieldErrors(prev => ({
      ...prev,
      [name]: { hasError: false, message: '' }
    }));
  }
};

  const handleSaveChanges = async () => {
    
  const isValid = validateFields();
  if (!isValid) {
    return; 
  }

  try {
    const authData = getClientAuthData();
    if (!authData) {
      router.push('/polyclinic/auth');
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/MyHelp/account?patientID=${authData.patientID}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authData.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          surname: editData.surname,
          name: editData.name,
          patronymic: editData.patronymic,
          polic: editData.polic,
          email: editData.email
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка при обновлении данных: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'success') {
      setPatientData(prev => prev ? { ...prev, ...editData } : null);
      setIsEditing(false);
    } else {
      throw new Error(data.message || 'Ошибка при обновлении данных');
    }
  } catch (err) {
    console.error('Failed to update patient data:', err);
    setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
  }
}


  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  if (loading) {
    return <div className={styles.loading}>Загрузка данных...</div>
  }

  if (error) {
    return <div className={styles.error}>{error}</div>
  }

  const handleRateAppointment = async (appointmentId: number, rating: number) => {
    console.log('[Rating] Starting rating process for appointment:', appointmentId);
    console.log('[Rating] Selected rating:', rating);
    
    try {
      // 1. Проверяем авторизацию
      const authData = getClientAuthData();
      console.log('[Rating] Auth data:', authData);
      
      if (!authData) {
        console.error('[Rating] No auth data, redirecting to login');
        router.push('/polyclinic/auth');
        return;
      }
  
      // 2. Проверяем доступность сервера
      try {
        const preflight = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`, { method: 'OPTIONS' });
        console.log('[Rating] CORS Preflight:', {
          status: preflight.status,
          headers: Object.fromEntries(preflight.headers.entries())
        });
      } catch (preflightError) {
        console.error('[Rating] CORS Preflight failed:', preflightError);
        throw new Error('Сервер недоступен или CORS не настроен');
      }
  
      // 3. Формируем запрос
      const requestBody = JSON.stringify({ rating: rating });
      console.log('[Rating] Request body:', requestBody);
  
      const requestInit: RequestInit = {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authData.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      };
      console.log('[Rating] Request config:', requestInit);
  
      // 4. Отправляем запрос
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/MyHelp/schedule/appointments/${appointmentId}`,
        requestInit
      );
  
      // 5. Обрабатываем ответ
      console.log('[Rating] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        console.error('[Rating] Error response text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
  
      const data = await response.json().catch(err => {
        console.error('[Rating] Failed to parse JSON:', err);
        throw new Error('Неверный формат ответа сервера');
      });
  
      console.log('[Rating] Response data:', data);
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Сервер вернул ошибку');
      }
  
      // 6. Обновляем состояние
      setRatingState(prev => ({ ...prev, [appointmentId]: rating }));
      setPatientData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          appointments: prev.appointments.map(app => 
            app.id === appointmentId ? { ...app, rating } : app
          )
        };
      });
      setActiveRatingId(null);
  
    } catch (err) {
      // Улучшенная обработка ошибок
      let errorMessage = 'Неизвестная ошибка';
      
      if (err instanceof TypeError) {
        errorMessage = 'Сетевая ошибка: ' + err.message;
        console.error('[Rating] Network error:', err);
      } else if (err instanceof Error) {
        errorMessage = err.message;
        console.error('[Rating] Error:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      } else {
        console.error('[Rating] Unknown error type:', {
          type: typeof err,
          value: err
        });
      }
      
      setError(errorMessage);
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    console.log('[Appointment] Starting cancellation for:', appointmentId);
    
    try {
      const authData = getClientAuthData();
      console.log('[Appointment] Auth data:', authData);
      
      if (!authData) {
        console.error('[Appointment] No auth data, redirecting to login');
        router.push('/polyclinic/auth');
        return;
      }
  
      // Подтверждение отмены
      const isConfirmed = window.confirm('Вы уверены, что хотите отменить запись?');
      if (!isConfirmed) return;
  
      console.log('[Appointment] Sending DELETE request');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/MyHelp/schedule/appointments/${appointmentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authData.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      console.log('[Appointment] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Appointment] Error response:', errorText);
        throw new Error(`Ошибка при отмене записи: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('[Appointment] Response data:', data);
  
      if (data.status === 'success') {
        // Обновляем локальное состояние
        setPatientData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            appointments: prev.appointments.map(app => 
              app.id === appointmentId ? { ...app, status: 'CANCELED' } : app
            )
          };
        });
        alert('Запись успешно отменена');
      } else {
        throw new Error(data.message || 'Ошибка при отмене записи');
      }
    } catch (err) {
      console.error('[Appointment] Cancellation error:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка при отмене записи');
    }
  };

  const StarRating = ({ appointmentId, currentRating }: { 
    appointmentId: number, 
    currentRating?: number 
  }) => {
    const rating = ratingState[appointmentId] ?? currentRating;
    console.log('[StarRating] Rendering for appointment:', appointmentId, 'with rating:', rating);
    
    return (
      <div className={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`${styles.star} ${star <= (rating || 0) ? styles.filled : ''}`}
            onClick={() => {
              console.log('[StarRating] Star clicked:', star, 'for appointment:', appointmentId);
              setActiveRatingId(appointmentId);
              handleRateAppointment(appointmentId, star);
            }}
            disabled={activeRatingId !== null && activeRatingId !== appointmentId}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Поликлиника №1</h1>
          <nav className={styles.nav}>
            <Link href="/polyclinic" className={styles.navLink}>Главная</Link>
            <button 
              onClick={handleLogout} 
              className={styles.navLink}
            >
              Выйти
            </button>
          </nav>
        </div>
      </header>
      
      <main className={styles.main}>
        <div className={styles.accountCard}>
        <div className={styles.profileSection}>
            <h2 className={styles.sectionTitle}>Личные данные</h2>
            
            {isEditing ? (
  <div className={styles.editForm}>
    <div className={styles.formGroup}>
      <label className={styles.editLabel}>Фамилия:</label>
      <input
        type="text"
        name="surname"
        value={editData.surname}
        onChange={handleInputChange}
        className={`${styles.editInput} ${fieldErrors.surname ? styles.errorInput : ''}`}
      />
      {fieldErrors.surname && <span className={styles.errorText}>Поле обязательно для заполнения</span>}
    </div>
    <div className={styles.formGroup}>
      <label className={styles.editLabel}>Имя:</label>
      <input
        type="text"
        name="name"
        value={editData.name}
        onChange={handleInputChange}
        className={`${styles.editInput} ${fieldErrors.name ? styles.errorInput : ''}`}
      />
      {fieldErrors.name && <span className={styles.errorText}>Поле обязательно для заполнения</span>}
    </div>
    <div className={styles.formGroup}>
      <label className={styles.editLabel}>Отчество:</label>
      <input
        type="text"
        name="patronymic"
        value={editData.patronymic}
        onChange={handleInputChange}
        className={styles.editInput}
      />
    </div>
    <div className={styles.formGroup}>
      <label className={styles.editLabel}>Номер полиса:</label>
      <input
        type="text"
        name="polic"
        value={editData.polic}
        onChange={handleInputChange}
        className={`${styles.editInput} ${fieldErrors.polic ? styles.errorInput : ''}`}
      />
      {fieldErrors.polic && <span className={styles.errorText}>Поле обязательно для заполнения</span>}
    </div>
    <div className={styles.formGroup}>
  <label className={styles.editLabel}>Email:</label>
  <input
    type="email"
    name="email"
    value={editData.email}
    onChange={handleInputChange}
    className={`${styles.editInput} ${
      fieldErrors.email.hasError ? `${styles.inputError} ${styles.shake}` : ''
    }`}
  />
  <div className={styles.errorMessage}>
    {fieldErrors.email.message}
  </div>
</div>
    <div className={styles.editButtons}>
      <button 
  onClick={handleSaveChanges} 
  className={styles.saveButton}
  disabled={
    fieldErrors.surname.hasError ||
    fieldErrors.name.hasError ||
    fieldErrors.polic.hasError ||
    fieldErrors.email.hasError ||
    !editData.surname ||
    !editData.name ||
    !editData.polic ||
    !editData.email
  }
>
  Сохранить
</button>
      <button onClick={handleCancelEdit} className={styles.cancelButton}>
        Отмена
      </button>
    </div>
  </div>
) : (
              <>
                <div className={styles.profileInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>ФИО:</span>
                    <span className={styles.infoValue}>
                      {patientData?.surname} {patientData?.name} {patientData?.patronymic}
                    </span>
                  </div>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Номер полиса:</span>
                    <span className={styles.infoValue}>{patientData?.polic}</span>
                  </div>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email:</span>
                    <span className={styles.infoValue}>{patientData?.email}</span>
                  </div>
                </div>
                
                <button onClick={handleEditClick} className={styles.editButton}>
                  Редактировать данные
                </button>
              </>
            )}
          </div>
          
          <div className={styles.appointmentsSection}>
            <h2 className={styles.sectionTitle}>Мои записи</h2>
            
            <div className={styles.appointmentTabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Все записи
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'scheduled' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('scheduled')}
              >
                Предстоящие
              </button>
              <button 
                className={`${styles.tab} ${activeTab === 'completed' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                Завершенные
              </button>
            </div>

            
            <div className={styles.appointmentsList}>
              {filteredAppointments.length ? (
                filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className={styles.appointmentCard}>
                    <div className={styles.appointmentHeader}>
                      <span className={styles.appointmentDate}>
                        {formatDate(appointment.date)}, {appointment.time.slice(0, 5)}
                      </span>
                      <span className={`${styles.appointmentStatus} ${getStatusColor(appointment.status)}`}>
                        {appointment.status === 'SCHEDULED' && 'Запланировано'}
                        {appointment.status === 'COMPLETED' && 'Завершено'}
                        {appointment.status === 'CANCELED' && 'Отменено'}
                      </span>
                    </div>
                    
                    <div className={styles.appointmentDoctor}>
                      <span className={styles.doctorName}>{appointment.doctor_fio}</span>
                      <span className={styles.doctorSpecialization}>
                        {appointment.doctor_specialization}
                      </span>
                    </div>
                    
                    {appointment.status === 'COMPLETED' && !appointment.rating && (
                      <div className={styles.appointmentRating}>
                        <p>Оцените прием:</p>
                        <StarRating 
                          appointmentId={appointment.id} 
                          currentRating={appointment.rating} 
                        />
                      </div>
                    )}
                    {appointment.status === 'COMPLETED' && appointment.rating && (
                      <div className={styles.appointmentRating}>
                        <p>Ваша оценка:</p>
                        <StarRating 
                          appointmentId={appointment.id} 
                          currentRating={appointment.rating} 
                        />
                      </div>
                    )}
                    
                    <div className={styles.appointmentActions}>
                      {appointment.status === 'SCHEDULED' && (
                        <button 
                          onClick={() => handleCancelAppointment(appointment.id)} 
                          className={styles.cancelButton}
                          disabled={loading}
                        >
                          Отменить запись
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noAppointments}>
                  {activeTab === 'all' && 'У вас пока нет записей'}
                  {activeTab === 'scheduled' && 'Нет предстоящих записей'}
                  {activeTab === 'completed' && 'Нет завершенных записей'}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
