import * as React from 'react';
import { Outlet, createRootRoute, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { LayoutCard } from '../components/ui/LayoutCard';

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    const { state, dispatch } = useAuth();

    const handleLogout = () => {
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
    };

    return (
        <React.Fragment>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
                {/* Navbar с использованием LayoutCard */}
                <LayoutCard
                    title={
                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            alignItems: 'center',
                            width: '100%'
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
                                        activeProps={{ style: { fontWeight: 'bold', color: '#007bff' } }}
                                        style={{ textDecoration: 'none', color: '#333' }}
                                    >
                                        Каталог
                                    </Link>
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
                            {
                                state.isAuthenticated && (
                                    <Button
                                        variant="secondary"
                                        size="small"
                                        onClick={handleLogout}
                                        style={{ marginLeft: 'auto' }}
                                    >
                                        Выйти ({state.user?.username})
                                    </Button>
                                )
                            }
                        </div>
                    }
                    footer={(
                        <div style={{
                            textAlign: 'center',
                            paddingTop: '20px',
                            marginTop: '40px',
                            color: '#000',
                            fontSize: '12px',
                            borderTop: '1px solid #e5e7eb'
                        }}>
                            © 2026 <strong>ShopName</strong>. Все права защищены. ™
                        </div>
                    )}
                >
                    {/* Контент страниц */}
                    <Outlet />
                </LayoutCard>
            </div>

            {/* DevTools только в разработке */}
            {import.meta.env.DEV && <TanStackRouterDevtools />}
        </React.Fragment>
    );
}