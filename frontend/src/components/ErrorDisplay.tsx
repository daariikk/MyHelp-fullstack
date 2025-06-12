import React from 'react';
import styles from './ErrorDisplay.module.css';
import Link from 'next/link'

type ErrorDisplayProps = {
  statusCode: number;
  message: string;
  children?: React.ReactNode;
};

export const ErrorDisplay = ({ statusCode, message, children }: ErrorDisplayProps) => {
  const getStatusMessage = () => {
    switch(statusCode) {
      case 404: return 'Не найдено';
      case 500: return 'Ошибка сервера';
      default: return 'Ошибка';
    }
  };

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
    <div className={styles.page}>
      <div className={styles.main} style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 600, marginBottom: '16px' }}>
          {statusCode}
        </h1>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>
          {getStatusMessage()}
        </h2>
        <p style={{ marginBottom: '32px' }}>{message}</p>
      </div>
    </div>
    </div>
  );
};