import React from 'react';
import styles from './Dashboard.module.css';
import { SectorData } from '@/lib/data';
import SectorSection from './SectorSection';

interface DashboardProps {
    data: SectorData[];
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
    // If data comes in as a promise due to some upstream mixup, handle it (though Typescript protects this usually)
    // But mostly likely the error is because 'data' was undefined or a Promise in the previous render cycle
    const safeData = Array.isArray(data) ? data : [];

    const today = new Date().toLocaleDateString('zh-CN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={`${styles.title} text-gradient`}>Daily Trend Pulse</h1>
                <div className={styles.date}>{today}</div>
            </header>

            <div className={styles.grid}>
                {safeData.map((sector) => (
                    <SectorSection key={sector.id} data={sector} />
                ))}
            </div>

            {safeData.length === 0 && (
                <div style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>
                    Loading Trends...
                </div>
            )}
        </div>
    );
};

export default Dashboard;
