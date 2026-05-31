import React from 'react';
import cn from 'classnames';
import styles from './Input.module.css';

interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    isFullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
                                                label,
                                                error,
                                                isFullWidth = false,
                                                ...props
                                            }) => {
    return (
        <div
            className={cn(styles.wrapper, {
                [styles.fullWidth]: isFullWidth,
            })}
        >
            <label className={styles.label}>
                {label}
            </label>

            <input
                className={cn(styles.input, {
                    [styles.errorInput]: error,
                })}
                {...props}
            />

            {error && (
                <span className={styles.error}>
                    {error}
                </span>
            )}
        </div>
    );
};