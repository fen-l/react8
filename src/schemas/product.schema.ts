import { z } from "zod";

export const ProductSchema = z.object({
    id: z.number(),
    title: z.string().min(3, "title: Название должно быть длинной не менее 3 символов"),
    price: z.number().gt(0, "price: Цена должна быть больше 0"),
    category: z.string(),
});

export type Product = z.infer<typeof ProductSchema>;