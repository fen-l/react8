import React from 'react';
import cn from 'classnames';
import styles from './Badge.module.css';

interface BadgeProps {
    color: 'green' | 'red' | 'orange' | 'blue';
    text: string;
}

export const Badge: React.FC<BadgeProps> = ({
                                                color,
                                                text,
                                            }) => {
    return (
        <span
            className={cn(
                styles.badge,
                styles[color]
            )}
        >
            {text}
        </span>
    );
};