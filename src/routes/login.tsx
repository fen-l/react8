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

    React.useEffect(() => {
        if (state.isAuthenticated) {
            navigate({ to: '/catalog' });
        }
    }, [state.isAuthenticated, navigate]);

    const handleLogin = () => {
        if (username && password) {
            const user = { username };
            localStorage.setItem('user', JSON.stringify(user));
            dispatch({ type: 'LOGIN', payload: user });
            navigate({ to: '/catalog' });
        }
    };

    return (
        <LayoutCard title="🔐 Авторизация">
            <div style={{ display: 'grid', gap: '16px' }}>
                <Input
                    label="Имя пользователя"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    isFullWidth
                />
                <Input
                    label="Пароль"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    isFullWidth
                />
                <Button variant="primary" onClick={handleLogin} isFullWidth>
                    Войти
                </Button>
            </div>
        </LayoutCard>
    );
}