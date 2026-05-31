import {useQuery} from '@tanstack/react-query';

interface Category {
    slug: string;
    name: string;
    url: string;
}

const fetchCategories = async (): Promise<Category[]> => {
    const response = await fetch('https://dummyjson.com/products/categories');
    return await response.json();
};

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
    });
};