import * as React from 'react';
import { Outlet, createRootRoute, Link, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    const { state, dispatch } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
        navigate({ to: '/' });
    };

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

    return (
        <React.Fragment>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
                {/* Navbar */}
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '30px',
                    padding: '10px',
                    borderBottom: '1px solid #ccc',
                    alignItems: 'center'
                }}>
                    <Link
                        to="/"
                        activeProps={{ style: { fontWeight: 'bold', color: '#007bff' } }}
                        style={{ textDecoration: 'none', color: '#333' }}
                    >
                        Главная
                    </Link>

                    {state.isAuthenticated ? (
                        <>
                            <Link
                                to="/catalog"
                                search={catalogSearchParams}
                                activeProps={{ style: { fontWeight: 'bold', color: '#007bff' } }}
                                style={{ textDecoration: 'none', color: '#333' }}
                            >
                                Каталог
                            </Link>
                            <div style={{ flex: 1 }} />
                            <span style={{ color: '#666', fontSize: '14px' }}>
                                {state.user?.username}
                            </span>
                            <Button
                                variant="secondary"
                                size="small"
                                onClick={handleLogout}
                            >
                                Выйти
                            </Button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            activeProps={{ style: { fontWeight: 'bold', color: '#007bff' } }}
                            style={{ textDecoration: 'none', color: '#333' }}
                        >
                            Войти
                        </Link>
                    )}
                </div>

                {/* Контент страниц */}
                <Outlet />
            </div>

            {/* DevTools только в разработке */}
            {import.meta.env.DEV && <TanStackRouterDevtools />}
        </React.Fragment>
    );
}