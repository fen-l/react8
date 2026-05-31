import React, { createContext, useContext, useReducer } from "react";
import type { Product } from "../../schemas/product.schema";

type State = {
    products: Product[];
    loading: boolean;
};

type Action =
    | { type: "SET_PRODUCTS"; payload: Product[] }
    | { type: "ADD_PRODUCT"; payload: Product }
    | { type: "UPDATE_PRODUCT"; payload: Product }
    | { type: "DELETE_PRODUCT"; payload: number }
    | { type: "SET_LOADING"; payload: boolean };

const initialState: State = {
    products: [],
    loading: false,
};

function productReducer(state: State, action: Action): State {
    switch (action.type) {
        case "SET_PRODUCTS":
            return { ...state, products: action.payload };

        case "ADD_PRODUCT":
            return {
                ...state,
                products: [action.payload, ...state.products],
            };

        case "UPDATE_PRODUCT":
            return {
                ...state,
                products: state.products.map((p) =>
                    p.id === action.payload.id ? action.payload : p
                ),
            };

        case "DELETE_PRODUCT":
            return {
                ...state,
                products: state.products.filter((p) => p.id !== action.payload),
            };

        default:
            return state;
    }
}

type ProductContextType = {
    state: State;
    dispatch: React.Dispatch<Action>;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({
                                                                             children,
                                                                         }) => {
    const [state, dispatch] = useReducer(productReducer, initialState);

    return (
        <ProductContext.Provider value={{ state, dispatch }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);

    if (!context) {
        throw new Error("useProducts must be used within ProductProvider");
    }

    return context;
};