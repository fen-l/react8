import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { ProductSchema, type Product } from '../schemas/product.schema';
import { LayoutCard } from '../components/ui/LayoutCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../hooks/useCategories';

interface RouterContext {
  queryClient: QueryClient;
  auth: {
    state: {
      isAuthenticated: boolean;
      user: { username: string } | null;
    };
    dispatch: React.Dispatch<any>;
  };
}

const fetchProductById = async (id: string): Promise<Product> => {
  const response = await fetch(`https://dummyjson.com/products/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Товар не найден');
    }
    throw new Error(`Ошибка загрузки: ${response.status}`);
  }

  const data = await response.json();
  return ProductSchema.parse(data);
};

const updateProductLocally = async (product: Product): Promise<Product> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return product;
};

export const Route = createFileRoute('/product/$id')({
  loader: async ({ params, context }) => {
    const { queryClient } = context as RouterContext;
    try {
      await queryClient.prefetchQuery({
        queryKey: ['product', params.id],
        queryFn: () => fetchProductById(params.id),
      });
    } catch (error) {
      // Ошибка префетча не должна ломать навигацию
      console.error('Prefetch failed:', error);
    }
  },
  component: ProductDetailComponent,
});

function ProductDetailComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedProduct, setEditedProduct] = React.useState<Product | null>(null);

  const { data: categories } = useCategories();

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

  const goBackToCatalog = () => {
    navigate({
      to: '/catalog',
      search: catalogSearchParams,
    });
  };

  React.useEffect(() => {
    if (!authState.isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [authState.isAuthenticated, navigate]);

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    retry: false, // Не повторяем запрос при ошибке
  });

  const updateMutation = useMutation({
    mutationFn: updateProductLocally,
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(['product', id], updatedProduct);
      queryClient.setQueryData<Product[]>(['products'], (old = []) =>
          old.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      );
      setIsEditing(false);
    },
  });

  React.useEffect(() => {
    if (product && !editedProduct) {
      setEditedProduct(product);
    }
  }, [product]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setEditedProduct(product || null);
  };
  const handleSave = () => {
    if (editedProduct) {
      updateMutation.mutate(editedProduct);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (editedProduct) {
      setEditedProduct({
        ...editedProduct,
        [e.target.name]: e.target.name === 'price' ? Number(e.target.value) : e.target.value,
      });
    }
  };

  if (isLoading) {
    return <LayoutCard title="Загрузка...">Загрузка товара...</LayoutCard>;
  }

  if (isError) {
    // Показываем понятное сообщение об ошибке
    const errorMessage = error?.message === 'Товар не найден'
        ? 'Товар с таким ID не существует'
        : 'Ошибка при загрузке товара';

    return (
        <LayoutCard title="Ошибка">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '18px' }}>
              {errorMessage}
            </div>
            <div style={{ marginBottom: '16px', color: '#6b7280' }}>
              ID товара: {id}
            </div>
            <Button variant="primary" onClick={goBackToCatalog}>
              Вернуться в каталог
            </Button>
          </div>
        </LayoutCard>
    );
  }

  if (!product) {
    return (
        <LayoutCard title="Товар не найден">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>Товар с ID {id} не существует.</div>
            <Button variant="primary" onClick={goBackToCatalog}>
              Вернуться в каталог
            </Button>
          </div>
        </LayoutCard>
    );
  }

  const categoryName = categories?.find(c => c.slug === product.category)?.name || product.category;

  return (
      <LayoutCard
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Детали товара</span>
              {!isEditing && (
                  <Button variant="secondary" size="small" onClick={handleEdit}>
                    Редактировать
                  </Button>
              )}
            </div>
          }
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={goBackToCatalog}>
                Назад в каталог
              </Button>
              {isEditing && (
                  <>
                    <Button variant="secondary" onClick={handleCancel}>
                      Отмена
                    </Button>
                    <Button variant="primary" onClick={handleSave} isLoading={updateMutation.isPending}>
                      Сохранить
                    </Button>
                  </>
              )}
            </div>
          }
      >
        {isEditing && editedProduct ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              <Input
                  label="Название товара"
                  name="title"
                  value={editedProduct.title}
                  onChange={handleChange}
                  isFullWidth
              />
              <Input
                  label="Цена (BYN)"
                  name="price"
                  type="number"
                  value={editedProduct.price}
                  onChange={handleChange}
                  isFullWidth
              />
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                  Категория
                </label>
                <select
                    name="category"
                    value={editedProduct.category || ''}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      backgroundColor: 'white',
                    }}
                >
                  <option value="">Выберите категорию</option>
                  {categories?.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                  ))}
                </select>
              </div>
            </div>
        ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div><strong>ID:</strong> {product.id}</div>
              <div><strong>Название:</strong> {product.title}</div>
              <div><strong>Категория:</strong> <Badge color="green" text={categoryName} /></div>
              <div><strong>Цена:</strong> ${product.price}</div>
            </div>
        )}
      </LayoutCard>
  );
}