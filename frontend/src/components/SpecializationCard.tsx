// components/SpecializationCard.tsx
import React from 'react'
import styles from './SpecializationCard.module.css'

interface Specialization {
  specializationID: number
  specialization: string
  specialization_doctor: string
  description: string
}

interface SpecializationCardProps {
  specialization: Specialization
  onDelete: (e: React.MouseEvent) => void
}

const SpecializationCard: React.FC<SpecializationCardProps> = ({ specialization, onDelete }) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <h3 className={styles.title}>{specialization.specialization}</h3>
        <p className={styles.doctor}>{specialization.specialization_doctor}</p>
        <p className={styles.description}>{specialization.description}</p>
      </div>
      <button 
        onClick={onDelete}
        className={styles.deleteButton}
        aria-label="Удалить специализацию"
      >
        ×
      </button>
    </div>
  )
}

export default SpecializationCard