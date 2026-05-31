import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type Product } from '../schemas/product.schema';
import { LayoutCard } from '../components/ui/LayoutCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../hooks/useCategories';

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
    body: JSON.stringify({
      title: product.title,
      price: product.price,
      category: product.category,
    }),
  });
  const data = await response.json();

  // DummyJSON возвращает id, title, price, category
  // Но эти данные не сохраняются на сервере реально
  return {
    id: data.id,
    title: data.title,
    price: data.price,
    category: data.category,
  };
};

function CreateProductComponent() {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const queryClient = useQueryClient();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const [form, setForm] = React.useState({
    title: '',
    price: 0,
    category: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.name === 'price'
          ? Number(e.target.value)
          : e.target.value,
    });
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
    if (!form.category.trim()) {
      newErrors.category = 'Выберите категорию';
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
      // Возвращаемся в каталог, а не на страницу нового товара
      goBackToCatalog();
    },
    onError: (error) => {
      console.error('Create failed:', error);
    },
  });

  const handleSubmit = () => {
    if (validate()) {
      createMutation.mutate(form);
    }
  };

  if (categoriesLoading) {
    return <LayoutCard title="Загрузка...">Загрузка категорий...</LayoutCard>;
  }

  return (
      <LayoutCard
          title="Создание нового товара"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={goBackToCatalog}>
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
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
              Категория
            </label>
            <select
                name="category"
                value={form.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${errors.category ? '#dc2626' : '#d1d5db'}`,
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
            {errors.category && (
                <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                  {errors.category}
                </div>
            )}
          </div>
        </div>
      </LayoutCard>
  );
}