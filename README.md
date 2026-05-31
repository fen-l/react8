# Лабораторная работа №8 Экосистема TanStack: Роутинг и Серверное состояние

## Meta
Author: Анастасия Лавриеня  
Stack: React, TypeScript, TanStack Router, TanStack Query, Zod, Vite

---

## Описание лабораторной работы

Данная лабораторная работа является модернизацией ЛР №7 путем замены ручного управления состоянием и навигацией на экосистему `TanStack`. Цель работы — переход от императивного `useEffect` к декларативному серверному состоянию и внедрение типобезопасного роутинга.

---

## Установка зависимостей

```bash
npm install @tanstack/react-router @tanstack/react-query
npm install @tanstack/react-query-devtools
```

## Ответы на контрольные вопросы

1. Почему использование useQuery предпочтительнее связки useEffect + useState для получения данных с сервера?

   `useQuery` автоматически управляет серверным состоянием: кэшированием, повторными запросами, обработкой ошибок, индикаторами загрузки и синхронизацией данных. При использовании `useEffect + useState` всю эту логику приходится реализовывать вручную, что увеличивает количество кода и вероятность ошибок.

2. В чем разница между staleTime и gcTime? Что произойдет, если пользователь вернется на страницу через 30 секунд при staleTime: 60000?

   - **staleTime** — время, в течение которого данные считаются актуальными (Fresh).
   - **gcTime** — время хранения неиспользуемых данных в кэше перед удалением.

   Если `staleTime: 60000` (60 секунд), а пользователь вернется на страницу через 30 секунд, данные останутся Fresh и повторный запрос к серверу выполнен не будет. Будут использованы данные из кэша.

3. Опишите жизненный цикл мутации при добавлении товара. Зачем нужен вызов invalidateQueries в методе onSuccess?

   Жизненный цикл мутации:

   1. Вызов `mutate()`.
   2. Выполнение `mutationFn`.
   3. Отображение состояния загрузки (`isPending`).
   4. Получение ответа от сервера.
   5. Выполнение `onSuccess` или `onError`.
   6. Обновление состояния интерфейса.

   Метод `invalidateQueries` помечает связанные запросы как устаревшие (Stale) и инициирует их повторную загрузку. Благодаря этому пользователь сразу видит актуальные данные после добавления товара.

4. Какую проблему решает TanStack Router в сравнении с обычными строковыми путями (например, в React Router v6)?

   TanStack Router обеспечивает типобезопасную навигацию. Маршруты, параметры и search-параметры проверяются TypeScript на этапе компиляции. Это позволяет обнаруживать ошибки в путях и параметрах до запуска приложения, а не во время выполнения.

5. Зачем нужен файл routeTree.gen.ts и как он помогает избежать runtime-ошибок при навигации?

   Файл `routeTree.gen.ts` автоматически генерируется TanStack Router на основе файловой структуры маршрутов. Он содержит типизированное дерево маршрутов, которое используется для проверки путей, параметров и навигации во время компиляции. Это помогает избежать ошибок, связанных с неверными именами маршрутов или отсутствующими параметрами.

6. Как работает механизм beforeLoad в TanStack Router и почему он надежнее проверки авторизации внутри useEffect компонента?

   `beforeLoad` выполняется до загрузки маршрута и его компонентов. Если пользователь не авторизован, можно выполнить:

   ```ts
   throw redirect({ to: '/login' });
   ```

   В этом случае защищенный компонент даже не начнет рендериться. Проверка через `useEffect` происходит уже после отображения компонента, что может привести к кратковременному показу закрытого контента и лишним запросам к серверу.

7. Если сервер пришлет поле price в виде строки вместо числа, на каком этапе Zod прервет выполнение программы и как это защитит UI?

   Ошибка будет обнаружена во время выполнения `ProductSchema.parse(data)` внутри `queryFn`. Zod выбросит исключение до сохранения данных в кэш TanStack Query. Благодаря этому некорректные данные не попадут в интерфейс, а пользователь увидит сообщение об ошибке («Ошибка структуры данных») вместо некорректного отображения или падения приложения.

8. Что такое «Оптимистичное обновление» и какие методы хука useMutation необходимы для его реализации?

   Оптимистичное обновление — это техника, при которой интерфейс обновляется сразу после действия пользователя, не дожидаясь ответа сервера.

   Для реализации используются:

   - `onMutate` — временное обновление кэша.
   - `onError` — откат изменений при ошибке.
   - `onSuccess` — подтверждение успешного обновления.
   - `onSettled` — финальная синхронизация данных.

   Это делает интерфейс более отзывчивым и улучшает пользовательский опыт.

9. С помощью DevTools продемонстрировать переход данных из состояния Fresh в Stale.

   Для демонстрации необходимо:

   1. Открыть TanStack Query DevTools.
   2. Выполнить запрос через `useQuery`.
   3. Установить, например:
      ```ts
      staleTime: 5000
      ```
   4. После загрузки данных наблюдать статус **Fresh**.
   5. Через 5 секунд статус автоматически изменится на **Stale**.
   6. При повторном открытии страницы или фокусе окна TanStack Query выполнит фоновое обновление данных.


# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
