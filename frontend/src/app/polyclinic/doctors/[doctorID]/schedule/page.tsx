'use client'
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './Schedule.module.css';
import BackButton from '@/components/BackButton';
import BookingModal from '@/components/BookingModal';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { getClientAuthData } from '@/lib/client-auth'

export default function DoctorSchedulePage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ doctorID: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  // Разворачиваем Promise с помощью use()
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  
  const doctorID = resolvedParams?.doctorID;
  const dateParam = resolvedSearchParams?.date;
  const date = dateParam || format(new Date(), 'yyyy-MM-dd');

  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{status: number; message: string} | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
    useEffect(() => {
      const authData = getClientAuthData()
      setIsAuthenticated(!!authData?.accessToken)
    }, [])

  const refreshData = () => {
    setRefreshTrigger(prev => !prev);
  };

  const formatTimeUTC = (timeString: string) => {
    const date = new Date(timeString);
    return date.toISOString().substring(11, 16);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/MyHelp/schedule/doctors/${doctorID}?date=${date}`,
          { cache: 'no-store' }
        );
        
        if (!res.ok) {
          let errorMessage = 'Произошла ошибка';
          if (res.status === 404) errorMessage = 'Врач не найден';
          else if (res.status === 500) errorMessage = 'Ошибка на сервере';
          
          throw { status: res.status, message: errorMessage };
        }
        
        const jsonData = await res.json();
        setData(jsonData);
      } catch (err: any) {
        setError({
          status: err.status || 500,
          message: err.message || 'Неизвестная ошибка'
        });
      } finally {
        setLoading(false);
      }
    };

    if (doctorID) {
      fetchData();
    }
  }, [doctorID, date, refreshTrigger]);

  const handleSlotClick = (slot: any) => {
    const authData = localStorage.getItem('auth');
    if (!authData) {
      window.location.href = '/polyclinic/auth';
      return;
    }
    
    setSelectedSlot(slot);
    setShowModal(true);
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка данных...</div>;
  }

  if (error) {
    return (
      <ErrorDisplay 
        statusCode={error.status} 
        message={error.message}
      />
    );
  }

  if (!data || data.status !== 'success' || !data.data) {
    return <div className={styles.error}>Неверный формат данных</div>;
  }

  const { doctor, schedule } = data.data;
  const records = schedule?.Records || [];

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
        <BackButton />
        {doctor && (
          <div className={styles.doctorInfo}>
            <div className={styles.photoContainer}>
              {doctor.photo ? (
                <img src={doctor.photo} alt={`${doctor.surname} ${doctor.name}`} className={styles.doctorPhoto} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  {doctor.surname.charAt(0)}{doctor.name.charAt(0)}
                </div>
              )}
            </div>
            <div className={styles.doctorDetails}>
              <h2 className={styles.doctorName}>
                {doctor.surname} {doctor.name} {doctor.patronymic}
              </h2>
              <p className={styles.specialization}>{doctor.specialization}</p>
              <p className={styles.education}>{doctor.education}</p>
              <p className={styles.progress}>{doctor.progress}</p>
              <div className={styles.rating}>
                Рейтинг: {doctor.rating.toFixed(1)} ★
              </div>
            </div>
          </div>
        )}
        
        <div className={styles.scheduleContainer}>
          <h3 className={styles.scheduleTitle}>Расписание приёма</h3>
          
          <form method="GET" className={styles.datePicker}>
            <label htmlFor="date">Выберите дату:</label>
            <input
              type="date"
              id="date"
              name="date"
              defaultValue={date}
              className={styles.dateInput}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
            <button type="submit" className={styles.submitButton}>Обновить</button>
          </form>
          
          <div className={styles.scheduleGrid}>
            {records.length > 0 ? (
              records.map((slot: any) => (
                <div key={slot.recordID} className={`${styles.timeSlot} ${
                  !slot.is_available ? styles.unavailable : ''
                }`}>
                  <span className={styles.time}>
                    {formatTimeUTC(slot.start_time)} - {formatTimeUTC(slot.end_time)}
                  </span>
                  <span className={styles.status}>
                    {slot.is_available ? 'Доступно' : 'Занято'}
                  </span>
                  {slot.is_available && (
                    <button
                      onClick={() => handleSlotClick(slot)}
                      className={styles.bookButton}
                    >
                      Записаться
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className={styles.noSlots}>Нет доступных временных слотов на выбранную дату</p>
            )}
          </div>
        </div>
      </main>

      {showModal && doctor && selectedSlot && (
        <BookingModal
          doctor={doctor}
          slot={selectedSlot}
          date={date}
          onClose={() => setShowModal(false)}
          onSuccess={refreshData}
        />  
      )}
    </div>
  );
}