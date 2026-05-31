import React, { useEffect, useState } from "react";
import { useProducts } from "../../../contexts/ProductContext";
import { Product, ProductSchema } from "../../../schemas/product.schema";

import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";

type Props = {
    editingProduct: Product | null;
    onFinish: () => void;
};

export const ProductForm: React.FC<Props> = ({
                                                 editingProduct,
                                                 onFinish,
                                             }) => {
    const { dispatch } = useProducts();

    const [form, setForm] = useState({
        id: 0,
        title: "",
        price: 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    // заполняем форму при edit
    useEffect(() => {
        if (editingProduct) {
            setForm(editingProduct);
        }
    }, [editingProduct]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setForm({
            ...form,
            [e.target.name]:
                e.target.name === "price"
                    ? Number(e.target.value)
                    : e.target.value,
        });
    };

    const validate = () => {
        const result = ProductSchema.safeParse(form);

        if (!result.success) {
            const flat = result.error.flatten().fieldErrors;

            setErrors({
                title: flat.title?.[0] || "",
                price: flat.price?.[0] || "",
            });

            return false;
        }

        setErrors({});
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);

        try {
            if (editingProduct) {
                try {
                    const res = await fetch(
                        `https://dummyjson.com/products/${form.id}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(form),
                        }
                    );

                    if (!res.ok) {
                        throw new Error(`HTTP error: ${res.status}`);
                    }
                } catch (e) {
                    console.log("API failed, но продолжаем (mock API)");
                }

                dispatch({
                    type: "UPDATE_PRODUCT",
                    payload: form,
                });
            } else {
                // CREATE
                const res = await fetch(
                    "https://dummyjson.com/products/add",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(form),
                    }
                );

                const data = await res.json();

                dispatch({
                    type: "ADD_PRODUCT",
                    payload: data,
                });
            }

            onFinish();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "grid", gap: 12 }}>
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

            <Button
                variant="primary"
                isLoading={loading}
                onClick={handleSubmit}
            >
                {editingProduct ? "Сохранить изменения" : "Добавить товар"}
            </Button>

            {editingProduct && (
                <Button
                    variant="secondary"
                    onClick={onFinish}
                >
                    Отмена
                </Button>
            )}
        </div>
    );
};