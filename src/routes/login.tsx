import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../contexts/AuthContext';
import { LayoutCard } from '../components/ui/LayoutCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Route = createFileRoute('/login')({
    component: LoginComponent,
});

function LoginComponent() {
    const { dispatch, state } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');

    // Получаем сохраненные параметры каталога
    const catalogSearchParams = React.useMemo(() => {
        const saved = localStorage.getItem('catalog_search_params');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return {};
            }
        }
        return {};
    }, []);

    React.useEffect(() => {
        if (state.isAuthenticated) {
            navigate({
                to: '/catalog',
                search: catalogSearchParams,
            });
        }
    }, [state.isAuthenticated, navigate, catalogSearchParams]);

    const handleLogin = () => {
        if (username.trim() && password.trim()) {
            const user = { username: username.trim() };
            localStorage.setItem('user', JSON.stringify(user));
            dispatch({ type: 'LOGIN', payload: user });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <LayoutCard title="Авторизация">
            <div style={{ display: 'grid', gap: '16px' }}>
                <Input
                    label="Имя пользователя"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    isFullWidth
                />
                <Input
                    label="Пароль"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    isFullWidth
                />
                <Button variant="primary" onClick={handleLogin} isFullWidth>
                    Войти
                </Button>
            </div>
        </LayoutCard>
    );
}