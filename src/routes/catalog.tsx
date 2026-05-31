import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { ProductSchema, type Product } from '../schemas/product.schema';
import { LayoutCard } from '../components/ui/LayoutCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';

// Схема для поисковых параметров
const SearchSchema = z.object({
    category: z.string().optional().default(''),
    page: z.number().min(1).optional().default(1),
});

type SearchParams = z.infer<typeof SearchSchema>;

const ITEMS_PER_PAGE = 10;

// Тип для ответа API
interface ProductsResponse {
    products: Product[];
    total: number;
    skip: number;
    limit: number;
}

// Получение списка категорий из отдельного эндпоинта
const fetchCategories = async (): Promise<string[]> => {
    const response = await fetch('https://dummyjson.com/products/categories');
    const data = await response.json();
    return data.map((cat: { slug: string; name: string; url: string }) => cat.name).sort();
};

export const Route = createFileRoute('/catalog')({
    validateSearch: (search: Record<string, unknown>): SearchParams => {
        return SearchSchema.parse({
            category: search.category || '',
            page: search.page ? Number(search.page) : 1,
        });
    },
    component: CatalogComponent,
});

// API функция с пагинацией и фильтрацией по категории
const fetchProducts = async (page: number, category: string): Promise<ProductsResponse> => {
    const skip = (page - 1) * ITEMS_PER_PAGE;

    let url: string;
    if (category) {
        url = `https://dummyjson.com/products/category/${encodeURIComponent(category)}?limit=${ITEMS_PER_PAGE}&skip=${skip}`;
    } else {
        url = `https://dummyjson.com/products?limit=${ITEMS_PER_PAGE}&skip=${skip}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    return {
        products: data.products.map((product: any) => ProductSchema.parse({
            id: product.id,
            title: product.title,
            price: product.price,
            category: product.category,
        })),
        total: data.total,
        skip: data.skip,
        limit: data.limit,
    };
};

const deleteProductAPI = async (_: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
};

function CatalogComponent() {
    const { state: authState } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [currentAgeSeconds, setCurrentAgeSeconds] = React.useState(0);

    const searchParams = Route.useSearch();
    const { category, page } = searchParams;

    const {
        data: productsData,
        isLoading: isLoadingProducts,
        isError: isErrorProducts,
        error: productsError,
        isFetching,
        isStale,
        dataUpdatedAt,
    } = useQuery({
        queryKey: ['products', page, category],
        queryFn: () => fetchProducts(page, category),
    });

    const {
        data: categories,
        isLoading: isLoadingCategories,
    } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
    });

    const products = productsData?.products || [];
    const totalProducts = productsData?.total || 0;
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    const updateSearch = (updates: Partial<SearchParams>) => {
        navigate({
            to: '/catalog',
            search: { ...searchParams, ...updates },
        });
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateSearch({ category: e.target.value, page: 1 });
    };

    const clearFilters = () => {
        updateSearch({ category: '', page: 1 });
    };

    const goToPage = (newPage: number) => {
        updateSearch({ page: newPage });
    };

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
            await queryClient.cancelQueries({ queryKey: ['products', page, category] });
            const previousData = queryClient.getQueryData<ProductsResponse>(['products', page, category]);
            if (previousData) {
                queryClient.setQueryData(['products', page, category], {
                    ...previousData,
                    products: previousData.products.filter((p) => p.id !== deletedId),
                    total: previousData.total - 1,
                });
            }
            return { previousData };
        },
        onError: (err, _, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['products', page, category], context.previousData);
            }
            console.error('Delete failed:', err);
        },
    });

    const isLoading = isLoadingProducts || isLoadingCategories;

    if (isLoading) {
        return <LayoutCard title="Загрузка...">Загрузка товаров...</LayoutCard>;
    }

    if (isErrorProducts) {
        return (
            <LayoutCard title="Ошибка">
                <div style={{ color: 'red' }}>
                    {productsError?.message || 'Ошибка загрузки данных'}
                </div>
            </LayoutCard>
        );
    }

    return (
        <div style={{ display: 'grid', gap: '16px' }}>
            {/* Индикатор статуса кэша */}
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

            {/* Фильтр по категории */}
            <LayoutCard title="Фильтр по категории">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                            Категория
                        </label>
                        <select
                            value={category}
                            onChange={handleCategoryChange}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '14px',
                                backgroundColor: 'white',
                            }}
                        >
                            <option value="">Все категории</option>
                            {categories?.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button variant="secondary" onClick={clearFilters}>
                        Очистить
                    </Button>
                </div>
            </LayoutCard>

            {/* Кнопки управления */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={() => navigate({ to: '/product/new' })}>
                    Добавить товар
                </Button>
                <Button
                    variant="secondary"
                    size="small"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['products', page, category] })}
                >
                    Принудительно обновить
                </Button>
            </div>

            {/* Результаты фильтрации */}
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Найдено товаров: {totalProducts}
                {category && ` в категории "${category}"`}
                <span style={{ marginLeft: '8px' }}>
                    (Страница {page} из {totalPages})
                </span>
            </div>

            {/* Список товаров */}
            {products.map((product) => (
                <LayoutCard
                    key={product.id}
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Товар: {product.title}</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Badge color="green" text={product.category} />
                                <Badge color="blue" text={`ID: ${product.id}`} />
                            </div>
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

            {/* Пагинация */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '16px',
                    flexWrap: 'wrap'
                }}>
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 1}
                    >
                        ← Назад
                    </Button>

                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 7) {
                                pageNum = i + 1;
                            } else if (page <= 4) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 3) {
                                pageNum = totalPages - 6 + i;
                            } else {
                                pageNum = page - 3 + i;
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={pageNum === page ? 'primary' : 'secondary'}
                                    size="small"
                                    onClick={() => goToPage(pageNum)}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => goToPage(page + 1)}
                        disabled={page === totalPages}
                    >
                        Вперед →
                    </Button>
                </div>
            )}

            {products.length === 0 && (
                <LayoutCard title="Ничего не найдено">
                    <div>Попробуйте выбрать другую категорию</div>
                </LayoutCard>
            )}
        </div>
    );
}