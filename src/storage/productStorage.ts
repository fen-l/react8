import type { Product } from '@/schemas/product.schema';

const STORAGE_KEY = 'product_changes';

export interface ProductChanges {
    created: Product[];
    updated: Product[];
    deleted: number[];
}

const createEmptyChanges = (): ProductChanges => ({
    created: [],
    updated: [],
    deleted: [],
});

export class ProductNotFoundError extends Error {
    constructor(id: number) {
        super(`Product ${id} not found`);
        this.name = 'ProductNotFoundError';
    }
}

export const resolveLocalProductById = (id: number): Product | null => {
    const changes = getProductChanges();

    // если удален ошибка бросается, ее ловят и понимают что не нужно ходить в DummyJSON
    if (changes.deleted.includes(id)) {
        throw new ProductNotFoundError(id);
    }

    const created = changes.created.find(p => p.id === id);
    if (created) return created;

    const updated = changes.updated.find(p => p.id === id);
    if (updated) return updated;

    return null;
};

export const getProductChanges = (): ProductChanges => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return createEmptyChanges();
        }

        const parsed = JSON.parse(raw) as Partial<ProductChanges>;

        return {
            created: Array.isArray(parsed.created) ? parsed.created : [],
            updated: Array.isArray(parsed.updated) ? parsed.updated : [],
            deleted: Array.isArray(parsed.deleted)
                ? parsed.deleted.map(Number)
                : [],
        };
    } catch {
        return createEmptyChanges();
    }
};

export const saveProductChanges = (
    changes: ProductChanges,
): void => {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(changes),
    );
};

export const clearProductChanges = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};

export const addCreatedProduct = (
    product: Product,
): void => {
    const changes = getProductChanges();

    changes.created.unshift(product);

    saveProductChanges(changes);
};

export const addUpdatedProduct = (
    product: Product,
): void => {
    const changes = getProductChanges();

    // если товар создан локально
    // обновляем его прямо в created
    const createdIndex = changes.created.findIndex(
        (p) => p.id === product.id,
    );

    if (createdIndex !== -1) {
        changes.created[createdIndex] = product;

        saveProductChanges(changes);
        return;
    }

    // иначе обновляем или добавляем в updated
    const updatedIndex = changes.updated.findIndex(
        (p) => p.id === product.id,
    );

    if (updatedIndex !== -1) {
        changes.updated[updatedIndex] = product;
    } else {
        changes.updated.push(product);
    }

    saveProductChanges(changes);
};

export const addDeletedProduct = (
    productId: number,
): void => {
    const changes = getProductChanges();

    // если товар создан локально
    // просто удаляем его из created
    const createdIndex = changes.created.findIndex(
        (p) => p.id === productId,
    );

    if (createdIndex !== -1) {
        changes.created.splice(createdIndex, 1);

        saveProductChanges(changes);
        return;
    }

    // убираем возможную локальную правку
    changes.updated = changes.updated.filter(
        (p) => p.id !== productId,
    );

    if (!changes.deleted.includes(productId)) {
        changes.deleted.push(productId);
    }

    saveProductChanges(changes);
};