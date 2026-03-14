import React from 'react';
import styles from './SectorSection.module.css';
import { SectorData } from '@/lib/data';
import TrendCard from './TrendCard';

interface SectorSectionProps {
    data: SectorData;
}

const SectorSection: React.FC<SectorSectionProps> = ({ data }) => {
    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <div className={styles.icon}>{data.icon}</div>
                    <h2 className={styles.title} style={{ textShadow: `0 0 15px ${data.accentColor}40` }}>
                        {data.name.split(' ').map((part, i) => (
                            <span key={i} className={part.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\u200D/g) ? styles.emojiPart : styles.textPart}>
                                {part}{i < data.name.split(' ').length - 1 ? ' ' : ''}
                            </span>
                        ))}
                    </h2>
                </div>
                <a
                    href={data.sectorUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.more}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                >
                    View All &rarr;
                </a>
            </div>
            <div className={styles.list}>
                {data.trends.map((item) => (
                    <TrendCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
};

export default SectorSection;
