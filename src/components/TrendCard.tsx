import React from 'react';
import styles from './TrendCard.module.css';
import { TrendItem } from '@/lib/data';

interface TrendCardProps {
    item: TrendItem;
}

const TrendCard: React.FC<TrendCardProps> = ({ item }) => {
    const getRankClass = (r: number) => {
        if (r === 1) return styles.rank1;
        if (r === 2) return styles.rank2;
        if (r === 3) return styles.rank3;
        return '';
    };

    const formatNumber = (num: number) => {
        return (num / 10000).toFixed(1) + 'w';
    };

    return (
        <a
            href={item.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cardLink}
        >
            <div className={styles.card}>
                <span className={`${styles.rank} ${getRankClass(item.rank)}`}>
                    {item.rank}
                </span>
                <div className={styles.content}>
                    <div className={styles.keyword}>{item.keyword}</div>
                    <div className={styles.meta}>
                        {!item.hideScore && (
                            <>
                                <span className={styles.hotScore}>
                                    {item.displayMetric ? (
                                        <span>{item.displayMetric}</span>
                                    ) : (
                                        <>🔥 {formatNumber(item.hotScore)}</>
                                    )}
                                </span>
                                {item.change > 0 && (
                                    <span className={`${styles.change} ${styles.up}`}>
                                        ▲ {item.change}
                                    </span>
                                )}
                                {item.change < 0 && (
                                    <span className={`${styles.change} ${styles.down}`}>
                                        ▼ {Math.abs(item.change)}
                                    </span>
                                )}
                                {item.change === 0 && (
                                    <span className={`${styles.change} ${styles.neutral}`}>-</span>
                                )}
                            </>
                        )}
                        {item.hideScore && (
                            <span className={styles.category}>{item.category}</span>
                        )}
                    </div>
                </div>
            </div>
        </a>
    );
};

export default TrendCard;
