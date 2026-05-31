import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Импортируем сгенерированное дерево маршрутов
import { routeTree } from './routeTree.gen';

// Импортируем провайдеры
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { AuthContextType } from './contexts/AuthContext';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,  // 60 секунд - данные считаются свежими
            gcTime: 5 * 60 * 1000, // 5 минут - хранение в кэше после размонтирования
            retry: 1,              // количество попыток при ошибке
            refetchOnWindowFocus: false, // не делать запрос при фокусе окна (для удобства демо)
        },
    },
});


// Создаем роутер
const router = createRouter({
    routeTree,
    context: {
        queryClient,
        auth: undefined! as AuthContextType,
    },
});

function RouterWithAuth() {
    const auth = useAuth();

    React.useEffect(() => {
        router.update({
            context: {
                queryClient,
                auth,
            },
        });
    }, [auth]);

    return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <RouterWithAuth />
            </AuthProvider>
        </QueryClientProvider>
    </React.StrictMode>
);