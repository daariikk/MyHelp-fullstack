'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './BookingModal.module.css';

export default function BookingModal({
  doctor,
  slot,
  date,
  onClose,
  onSuccess // Добавляем новый пропс
}: {
  doctor: any;
  slot: any;
  date: string;
  onClose: () => void;
  onSuccess: () => void; // Функция для обновления данных
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Проверяем авторизацию
      const authData = localStorage.getItem('auth');
      if (!authData) {
        router.push('/polyclinic/auth');
        return;
      }

      const { patientID, accessToken } = JSON.parse(authData);
      
      // 2. Отправляем запрос на сервер
      const response = await fetch('http://localhost:8085/MyHelp/schedule/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctorID: doctor.doctorID,
          patientID: patientID,
          date: date,
          time: slot.start_time.split('T')[1].slice(0, 8)
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка при создании записи');
      }

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error(data.message || 'Ошибка сервера');
      }

      // 3. После успешной записи:
      onClose(); // Закрываем модальное окно
      onSuccess(); // Вызываем функцию обновления данных
      alert('Запись успешно создана!');

    } catch (err) {
      console.error('Booking error:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Подтверждение записи</h3>
        <p>Вы записываетесь к врачу: {doctor.surname} {doctor.name} {doctor.patronymic}</p>
        <p>Специализация: {doctor.specialization}</p>
        <p>Дата: {new Date(date).toLocaleDateString('ru-RU')}</p>
        <p>Время: {slot.start_time.split('T')[1].slice(0, 5)}</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.modalButtons}>
          <button 
            onClick={handleConfirm} 
            disabled={loading}
            className={styles.confirmButton}
          >
            {loading ? 'Обработка...' : 'Подтвердить'}
          </button>
          <button 
            onClick={onClose} 
            disabled={loading}
            className={styles.cancelButton}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}