import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductSchema, type Product } from '../schemas/product.schema';
import { LayoutCard } from '../components/ui/LayoutCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

export const Route = createFileRoute('/product/new')({
  component: CreateProductComponent,
});

// API функция создания
const createProductAPI = async (product: Omit<Product, 'id'>): Promise<Product> => {
  const response = await fetch('https://dummyjson.com/products/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(product),
  });
  const data = await response.json();
  // DummyJSON возвращает продукт с новым id
  return ProductSchema.parse({
    id: data.id,
    title: data.title,
    price: data.price,
  });
};

export default function CreateProductComponent() {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({
    title: '',
    price: 0,
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Проверка авторизации
  React.useEffect(() => {
    if (!authState.isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [authState.isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.name === 'price'
          ? Number(e.target.value)
          : e.target.value,
    });
    // Очищаем ошибку при изменении поля
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim() || form.title.length < 3) {
      newErrors.title = 'Название должно содержать минимум 3 символа';
    }
    if (form.price <= 0) {
      newErrors.price = 'Цена должна быть больше 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: createProductAPI,
    onSuccess: (newProduct) => {
      // Обновляем кэш списка продуктов
      queryClient.setQueryData<Product[]>(['products'], (old = []) => {
        return [newProduct, ...old];
      });
      // Переходим на страницу нового продукта
      navigate({ to: `/product/${newProduct.id}` });
    },
  });

  const handleSubmit = () => {
    if (validate()) {
      createMutation.mutate(form);
    }
  };

  return (
      <LayoutCard
          title="Создание нового товара"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => navigate({ to: '/catalog' })}>
                Отмена
              </Button>
              <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={createMutation.isPending}
              >
                Создать
              </Button>
            </div>
          }
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <Input
              label="Название товара"
              name="title"
              value={form.title}
              onChange={handleChange}
              error={errors.title}
              isFullWidth
          />
          <Input
              label="Цена (BYN)"
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              error={errors.price}
              isFullWidth
          />
        </div>
      </LayoutCard>
  );
}