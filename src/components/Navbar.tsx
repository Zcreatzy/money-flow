import React from 'react';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
    return (
        <nav className={styles.nav}>
            <div className={styles.logo}>
                <span className={styles.accent}>$</span>
                <span className={styles.logoText}>MoneyFlow</span>
            </div>
            <div className={styles.links}>
                <a href="#" className={`${styles.link} ${styles.active}`}>Dashboard</a>
            </div>
        </nav>
    );
};

export default Navbar;
