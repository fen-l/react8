import { createFileRoute, Link } from '@tanstack/react-router';
import { LayoutCard } from '../components/ui/LayoutCard';
import { Button } from '../components/ui/Button';

export const Route = createFileRoute('/')({
    component: IndexComponent,
});

function IndexComponent() {
    return (
        <LayoutCard title="Добро пожаловать в магазин!">
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                    Здесь вы найдете лучшие товары по отличным ценам!
                </p>
                <Link to="/login">
                    <Button variant="primary">
                        Начать покупки
                    </Button>
                </Link>
            </div>
        </LayoutCard>
    );
}