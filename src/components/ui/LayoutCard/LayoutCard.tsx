import React from 'react';
import styles from './LayoutCard.module.css';

interface LayoutCardProps {
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export const LayoutCard: React.FC<LayoutCardProps> = ({
                                                          title,
                                                          children,
                                                          footer,
                                                      }) => {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                {title}
            </div>

            <div className={styles.content}>
                {children}
            </div>

            {footer && (
                <div className={styles.footer}>
                    {footer}
                </div>
            )}
        </div>
    );
};