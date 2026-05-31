import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { ProductSchema, type Product } from '../schemas/product.schema';
import { LayoutCard } from '../components/ui/LayoutCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

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
  const data = await response.json();
  return ProductSchema.parse(data);
};

// Просто имитируем сохранение - никаких запросов к API
const updateProductLocally = async (product: Product): Promise<Product> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return product;
};

export const Route = createFileRoute('/product/$id')({
  loader: async ({ params, context }) => {
    const { queryClient } = context as RouterContext;
    await queryClient.prefetchQuery({
      queryKey: ['product', params.id],
      queryFn: () => fetchProductById(params.id),
    });
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

  React.useEffect(() => {
    if (!authState.isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [authState.isAuthenticated, navigate]);

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
  });

  const updateMutation = useMutation({
    mutationFn: updateProductLocally,
    onSuccess: (updatedProduct) => {
      // Обновляем кэш детального товара
      queryClient.setQueryData(['product', id], updatedProduct);
      // Обновляем товар в списке
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    return (
        <LayoutCard title="Ошибка">
          <div style={{ color: 'red' }}>Ошибка: {error.message}</div>
          <Button variant="secondary" onClick={() => navigate({ to: '/catalog' })}>
            Назад в каталог
          </Button>
        </LayoutCard>
    );
  }

  if (!product) {
    return (
        <LayoutCard title="Товар не найден">
          <Button variant="secondary" onClick={() => navigate({ to: '/catalog' })}>
            Назад в каталог
          </Button>
        </LayoutCard>
    );
  }

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
              <Button variant="secondary" onClick={() => navigate({ to: '/catalog' })}>
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
            </div>
        ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div><strong>ID:</strong> {product.id}</div>
              <div><strong>Название:</strong> {product.title}</div>
              <div><strong>Цена:</strong> ${product.price}</div>
            </div>
        )}
      </LayoutCard>
  );
}