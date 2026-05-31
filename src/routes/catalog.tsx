import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ProductSchema, type Product } from '../schemas/product.schema';
import { LayoutCard } from '../components/ui/LayoutCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { z } from 'zod';

// Схема для поисковых параметров
const SearchSchema = z.object({
    search: z.string().optional().default(''),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
});

type SearchParams = z.infer<typeof SearchSchema>;

export const Route = createFileRoute('/catalog')({
    // Валидация search params через Zod
    validateSearch: (search: Record<string, unknown>): SearchParams => {
        return SearchSchema.parse({
            search: search.search || '',
            minPrice: search.minPrice ? Number(search.minPrice) : undefined,
            maxPrice: search.maxPrice ? Number(search.maxPrice) : undefined,
        });
    },
    component: CatalogComponent,
});

// API функции с валидацией
const fetchProducts = async (): Promise<Product[]> => {
    const response = await fetch('https://dummyjson.com/products');
    const data = await response.json();
    // Валидация каждого продукта через Zod
    return data.products.map((product: unknown) => ProductSchema.parse(product));
};

const deleteProductAPI = async (_: number): Promise<void> => {
    // Имитация удаления (DummyJSON не поддерживает реальное удаление)
    await new Promise(resolve => setTimeout(resolve, 500));
};

function CatalogComponent() {
    const { state: authState } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [currentAgeSeconds, setCurrentAgeSeconds] = React.useState(0);

    const {
        data: products,
        isLoading,
        isError,
        error,
        isFetching,
        isStale,
        dataUpdatedAt,
    } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
    });

    React.useEffect(() => {
        if (!authState.isAuthenticated) {
            navigate({ to: '/login' });
        }
    }, [authState.isAuthenticated, navigate]);

    React.useEffect(() => {
        if (!dataUpdatedAt) return;
        const updateAge = () => {
            const age = Date.now() - dataUpdatedAt;
            setCurrentAgeSeconds(Math.floor(age / 1000));
        };
        updateAge();
        const interval = setInterval(updateAge, 1000);
        return () => clearInterval(interval);
    }, [dataUpdatedAt]);

    const lastUpdated = dataUpdatedAt
        ? new Date(dataUpdatedAt).toLocaleTimeString()
        : 'никогда';

    const isDataStale = currentAgeSeconds >= 60;
    const remainingSeconds = Math.max(0, 60 - currentAgeSeconds);

    const deleteMutation = useMutation({
        mutationFn: deleteProductAPI,
        onMutate: async (deletedId) => {
            await queryClient.cancelQueries({ queryKey: ['products'] });
            const previousProducts = queryClient.getQueryData<Product[]>(['products']);
            queryClient.setQueryData<Product[]>(['products'], (old) =>
                old?.filter((p) => p.id !== deletedId) ?? []
            );
            return { previousProducts };
        },
        onError: (err, _, context) => {
            if (context?.previousProducts) {
                queryClient.setQueryData(['products'], context.previousProducts);
            }
            console.error('Delete failed:', err);
        },
    });

    if (isLoading) {
        return <LayoutCard title="Загрузка...">Загрузка товаров...</LayoutCard>;
    }

    if (isError) {
        return (
            <LayoutCard title="Ошибка">
                <div style={{ color: 'red' }}>
                    {error?.message || 'Ошибка загрузки данных'}
                </div>
            </LayoutCard>
        );
    }

    return (
        <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{
                padding: '12px',
                backgroundColor: isDataStale ? '#fee2e2' : '#dcfce7',
                borderRadius: '8px',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
            }}>
                <div>
                    <strong>Статус кэша:</strong>{' '}
                    {isFetching ? 'Обновление...' : 'Данные загружены'}
                    {isStale && ' (данные устарели)'}
                </div>
                <div>
                    <strong>Возраст данных:</strong> {currentAgeSeconds} сек
                </div>
                <div>
                    <strong>Статус:</strong>{' '}
                    {isDataStale ? 'Устарели (stale)' : `Свежие (fresh) — еще ${remainingSeconds} сек`}
                </div>
                <div>
                    <strong>Последнее обновление:</strong> {lastUpdated}
                </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#6b7280' }}>
                    <span>Fresh</span>
                    <span>Stale</span>
                </div>
                <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${(currentAgeSeconds / 60) * 100}%`,
                        height: '100%',
                        backgroundColor: isDataStale ? '#dc2626' : '#10b981',
                        transition: 'width 1s linear'
                    }} />
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', color: '#6b7280', textAlign: 'center' }}>
                    staleTime: 60 секунд
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={() => navigate({ to: '/product/new' })}>
                    Добавить товар
                </Button>
                <Button
                    variant="secondary"
                    size="small"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
                >
                    Принудительно обновить
                </Button>
            </div>

            {products?.map((product) => (
                <LayoutCard
                    key={product.id}
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Товар: {product.title}</span>
                            <Badge color="blue" text={`ID: ${product.id}`} />
                        </div>
                    }
                >
                    <div style={{ marginBottom: 12 }}>
                        <strong>Цена:</strong> ${product.price}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={() => navigate({ to: `/product/${product.id}` })}
                        >
                            Подробнее
                        </Button>
                        <Button
                            variant="danger"
                            size="small"
                            onClick={() => deleteMutation.mutate(product.id)}
                            isLoading={deleteMutation.isPending}
                        >
                            Удалить
                        </Button>
                    </div>
                </LayoutCard>
            ))}
        </div>
    );
}