import React, { createContext, useContext, useEffect, useReducer } from "react";

type User = {
    username: string;
};

type AuthState = {
    user: User | null;
    isAuthenticated: boolean;
};

type Action =
    | { type: "LOGIN"; payload: User }
    | { type: "LOGOUT" };

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
};

function authReducer(state: AuthState, action: Action): AuthState {
    switch (action.type) {
        case "LOGIN":
            return {
                user: action.payload,
                isAuthenticated: true,
            };

        case "LOGOUT":
            return {
                user: null,
                isAuthenticated: false,
            };

        default:
            return state;
    }
}

export type AuthContextType = {
    state: AuthState;
    dispatch: React.Dispatch<Action>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
                                                                          children,
                                                                      }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const saved = localStorage.getItem("user");

        if (saved) {
            dispatch({
                type: "LOGIN",
                payload: JSON.parse(saved),
            });
        }
    }, []);

    return (
        <AuthContext.Provider value={{ state, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
};