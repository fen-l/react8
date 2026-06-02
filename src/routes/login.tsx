import * as React from 'react';
import { z } from 'zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { useAuth } from '../contexts/AuthContext';
import { LayoutCard } from '../components/ui/LayoutCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Route = createFileRoute('/login')({
    component: LoginComponent,
});

/* 1. ZOD SCHEMA */

const LoginSchema = z.object({
    email: z.string().email('Некорректный email'),
    password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
    username: z.string().min(1, 'Имя обязательно'),
    city: z.string().min(1, 'Город обязателен'),
    occupation: z.string().min(1, 'Выберите профессию'),
    agree: z.boolean().refine((val) => val, {
        message: 'Нужно согласиться с правилами',
    }),
});

type FormData = z.infer<typeof LoginSchema>;

/* 2. STATE */

interface IFormState {
    currentStep: 1 | 2 | 3;
    formData: FormData;
    errors: Record<string, string>;
    isSubmitting: boolean;
}

type TFormAction =
    | {
          type: 'UPDATE_FIELD';
          field: keyof FormData;
          value: FormData[keyof FormData];
      }
    | {
          type: 'SET_ERRORS';
          errors: Record<string, string>;
      }
    | {
          type: 'NEXT_STEP';
      }
    | {
          type: 'PREV_STEP';
      }
    | {
          type: 'SUBMIT_START';
      }
    | {
          type: 'SUBMIT_SUCCESS';
      };

/* 3. INITIAL STATE */

const initialState: IFormState = {
    currentStep: 1,
    isSubmitting: false,
    errors: {},
    formData: {
        email: '',
        password: '',
        username: '',
        city: '',
        occupation: '',
        agree: false,
    },
};

/* 4. REDUCER */

function loginReducer(
    state: IFormState,
    action: TFormAction
): IFormState {
    switch (action.type) {
        case 'UPDATE_FIELD':
            return {
                ...state,
                formData: {
                    ...state.formData,
                    [action.field]: action.value,
                },
                errors: {
                    ...state.errors,
                    [action.field]: '',
                },
            };

        case 'SET_ERRORS':
            return {
                ...state,
                errors: action.errors,
            };

        case 'NEXT_STEP':
            return {
                ...state,
                currentStep: (state.currentStep + 1) as 1 | 2 | 3,
            };

        case 'PREV_STEP':
            return {
                ...state,
                currentStep: (state.currentStep - 1) as 1 | 2 | 3,
            };

        case 'SUBMIT_START':
            return {
                ...state,
                isSubmitting: true,
            };

        case 'SUBMIT_SUCCESS':
            return {
                ...state,
                isSubmitting: false,
            };

        default:
            return state;
    }
}

/* 5. HELPERS */

const formatZodErrors = (issues: z.ZodIssue[]) => {
    const errors: Record<string, string> = {};

    issues.forEach((issue) => {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
    });

    return errors;
};

/* 6. COMPONENT */

function LoginComponent() {
    const { dispatch, state: authState } = useAuth();
    const navigate = useNavigate();

    const [state, formDispatch] = React.useReducer(
        loginReducer,
        initialState
    );

    const catalogSearchParams = React.useMemo(() => {
        const saved = localStorage.getItem(
            'catalog_search_params'
        );

        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return {};
            }
        }

        return {};
    }, []);

    React.useEffect(() => {
        if (authState.isAuthenticated) {
            navigate({
                to: '/catalog',
                search: catalogSearchParams,
            });
        }
    }, [
        authState.isAuthenticated,
        navigate,
        catalogSearchParams,
    ]);

    const validateStep = (step: number) => {
        let schema;

        switch (step) {
            case 1:
                schema = LoginSchema.pick({
                    email: true,
                    password: true,
                });
                break;

            case 2:
                schema = LoginSchema.pick({
                    username: true,
                    city: true,
                });
                break;

            case 3:
                schema = LoginSchema.pick({
                    occupation: true,
                    agree: true,
                });
                break;

            default:
                return true;
        }

        const result = schema.safeParse(state.formData);

        if (!result.success) {
            formDispatch({
                type: 'SET_ERRORS',
                errors: formatZodErrors(
                    result.error.issues
                ),
            });

            return false;
        }

        formDispatch({
            type: 'SET_ERRORS',
            errors: {},
        });

        return true;
    };

    const handleNext = () => {
        if (validateStep(state.currentStep)) {
            formDispatch({
                type: 'NEXT_STEP',
            });
        }
    };

    const handlePrev = () => {
        formDispatch({
            type: 'PREV_STEP',
        });
    };

    const handleSubmit = () => {
        if (!validateStep(3)) {
            return;
        }

        formDispatch({
            type: 'SUBMIT_START',
        });

        const user = {
            username: state.formData.username.trim(),
        };

        localStorage.setItem(
            'user',
            JSON.stringify(user)
        );

        dispatch({
            type: 'LOGIN',
            payload: user,
        });

        formDispatch({
            type: 'SUBMIT_SUCCESS',
        });
    };

    return (
        <LayoutCard
            title={
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <span>Авторизация</span>

                    <span>
                        Шаг {state.currentStep} из 3
                    </span>
                </div>
            }
            footer={
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                    }}
                >
                    {state.currentStep > 1 && (
                        <Button
                            variant="secondary"
                            onClick={handlePrev}
                        >
                            Назад
                        </Button>
                    )}

                    {state.currentStep < 3 && (
                        <Button
                            variant="primary"
                            onClick={handleNext}
                        >
                            Далее
                        </Button>
                    )}

                    {state.currentStep === 3 && (
                        <Button
                            variant="primary"
                            isLoading={state.isSubmitting}
                            onClick={handleSubmit}
                        >
                            Войти
                        </Button>
                    )}
                </div>
            }
        >
            {state.currentStep === 1 && (
                <>
                    <Input
                        label="Email"
                        value={state.formData.email}
                        onChange={(e) =>
                            formDispatch({
                                type: 'UPDATE_FIELD',
                                field: 'email',
                                value: e.target.value,
                            })
                        }
                        error={state.errors.email}
                        isFullWidth
                    />

                    <Input
                        label="Пароль"
                        type="password"
                        value={state.formData.password}
                        onChange={(e) =>
                            formDispatch({
                                type: 'UPDATE_FIELD',
                                field: 'password',
                                value: e.target.value,
                            })
                        }
                        error={state.errors.password}
                        isFullWidth
                    />
                </>
            )}

            {state.currentStep === 2 && (
                <>
                    <Input
                        label="Имя пользователя"
                        value={state.formData.username}
                        onChange={(e) =>
                            formDispatch({
                                type: 'UPDATE_FIELD',
                                field: 'username',
                                value: e.target.value,
                            })
                        }
                        error={state.errors.username}
                        isFullWidth
                    />

                    <Input
                        label="Город"
                        value={state.formData.city}
                        onChange={(e) =>
                            formDispatch({
                                type: 'UPDATE_FIELD',
                                field: 'city',
                                value: e.target.value,
                            })
                        }
                        error={state.errors.city}
                        isFullWidth
                    />
                </>
            )}

            {state.currentStep === 3 && (
                <>
                    <Input
                        label="Профессия"
                        value={state.formData.occupation}
                        onChange={(e) =>
                            formDispatch({
                                type: 'UPDATE_FIELD',
                                field: 'occupation',
                                value: e.target.value,
                            })
                        }
                        error={state.errors.occupation}
                        isFullWidth
                    />

                    <label
                        style={{
                            display: 'flex',
                            gap: 8,
                            marginTop: 12,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={state.formData.agree}
                            onChange={(e) =>
                                formDispatch({
                                    type: 'UPDATE_FIELD',
                                    field: 'agree',
                                    value: e.target.checked,
                                })
                            }
                        />
                        Я согласен с правилами
                    </label>

                    {state.errors.agree && (
                        <div
                            style={{
                                color: 'red',
                            }}
                        >
                            {state.errors.agree}
                        </div>
                    )}
                </>
            )}
        </LayoutCard>
    );
}