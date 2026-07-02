# Frontend

React + Vite + Ant Design SPA. API под `/api/*`, prod-сборка отдаётся бэкендом из `src/static/dist`.

## Структура `frontend/src/`

```
src/
├── api.ts              — HTTP-клиент и API-функции
├── auth.tsx            — авторизация, JWT, контекст пользователя
├── types.ts            — типы и константы (роли, инвойсы, XUI)
├── App.tsx             — роутинг
├── main.tsx            — точка входа
│
├── config/
│   └── navigation.ts   — пункты меню (единый источник)
│
├── utils/
│   ├── format.ts       — форматирование данных
│   ├── apiError.ts     — текст ошибок API
│   ├── pagination.ts   — пустая paginated-структура
│   └── clipboard.ts    — копирование в буфер
│
├── hooks/
│   ├── useCopyToClipboard.ts
│   ├── useMediaQuery.ts
│   └── useServiceStatus.tsx
│
├── components/         — переиспользуемые UI-блоки
├── layouts/            — оболочка приложения
├── pages/              — страницы (собирают компоненты)
└── theme/              — тема (светлая/тёмная)
```

## Роутинг (`App.tsx`)

| Путь | Страница | Доступ |
|------|----------|--------|
| `/login` | `LoginPage` | гость |
| `/profile` | `ProfilePage` | авторизованный |
| `/payment/success`, `/payment/fail` | result-страницы | авторизованный |
| `/forbidden` | `ForbiddenPage` | авторизованный |
| `/monitoring` | `MonitoringPage` | admin |
| `/payments` | `PaymentsPage` | admin |
| `/users` | `UsersPage` | admin |

Admin-роуты обёрнуты в `RequireAdmin`.

---

## Компоненты (`components/`)

### Layout и оболочки

| Компонент | Назначение | Где используется |
|-----------|------------|------------------|
| `AdminPageLayout` | Заголовок H3 + двухколоночный `Row` | `UsersPage`, `PaymentsPage`, `MonitoringPage` |
| `AdminPageColumn` | Колонка `Col xs=24 lg/xl=12` | те же admin-страницы |
| `SectionCard` | `Card` + подсказка + отступ для контента | секции на admin-страницах и в профиле |
| `AppLayout` *(layouts/)* | Header, sidebar, footer, outlet | все защищённые страницы |

### Списки и пагинация

| Компонент | Назначение | Где используется |
|-----------|------------|------------------|
| `AsyncListState` | Spin → Empty → список с отступами (`Space`) | «Все пользователи», «Все счета», «Мои счета» |
| `PaginationFooter` | «Страница X из Y» + Назад/Вперёд | `UsersPage`, `PaymentsPage` |

### Карточки сущностей

| Компонент | Назначение | Заменил |
|-----------|------------|---------|
| `UserCard` | Карточка пользователя (ID, роль, sub_url) | `UserRow` в UsersPage |
| `XuiClientCard` | Подписка XUI: трафик, срок, sub_url | `XuiClientDetails` (admin) + `XuiSubscriptionCard` (profile) |
| `InvoiceCard` | Карточка счёта | `ProfileInvoiceCard` + `InvoiceRow` |

**`XuiClientCard`** — prop `variant`:

- `"admin"` — заголовок = email, без «Лимит IP»
- `"profile"` — заголовок «Подписка», с «Лимит IP»

**`InvoiceCard`** — prop `variant`:

- `"profile"` — сумма в title, кнопка «Оплатить» (если `canRenew`)
- `"admin"` — ID, username, mark, sub_url, копирование ID

### Формы и действия

| Компонент | Назначение | Где используется |
|-----------|------------|------------------|
| `LookupActionForm` | Input + «Получить» + «Удалить» (Popconfirm) | UsersPage: поиск user / XUI client |
| `CompactFormAction` | Input + одна submit-кнопка | PaymentsPage: отмена счёта |
| `UserLookupPanel` | Loading / not found / `UserCard` | UsersPage: результат поиска по ID |
| `CopyableInput` | Readonly input + копирование (текст или icon) | ссылки для входа, sub_url в XUI |
| `CopyableText` | Кликабельный текст → копирование | ID счёта в admin-списке |

### Прочие UI

| Компонент | Назначение | Где используется |
|-----------|------------|------------------|
| `ProfileResultPage` | `Result` + кнопка «Перейти в профиль» | `PaymentSuccessPage`, `PaymentFailPage`, `ForbiddenPage` |
| `ThemedIconAvatar` | Аватар с иконкой/буквой | ProfilePage, XuiClientCard, навигация |
| `ServiceStatusBanner` | Баннер недоступных сервисов | `AppLayout` |
| `ThemeToggle` | Переключатель темы | footer, LoginPage |
| `RequireAdmin` | Guard для admin-роутов | `App.tsx` |

---

## Утилиты и хуки

| Файл | Что делает |
|------|------------|
| `utils/format.ts` | `formatTraffic`, `formatLimitIps`, `displayName`, `avatarLetter` |
| `utils/apiError.ts` | `getApiErrorMessage(error, fallback)` |
| `utils/pagination.ts` | `emptyPaginated(limit)` — начальное состояние списков |
| `utils/clipboard.ts` | `copyToClipboard(text)` |
| `hooks/useCopyToClipboard.ts` | копирование + toast «Скопировано» |
| `hooks/useMediaQuery.ts` | breakpoint `(max-width: 991.98px)` |
| `hooks/useServiceStatus.tsx` | polling статуса сервисов, `paymentBlocked` |

---

## Конфиг навигации

`config/navigation.ts` — единый `NAV_ITEMS`:

- sidebar в `AppLayout` (`label` → пункт меню)
- карточки «Для тебя доступны разделы» на `ProfilePage` (`label` + `hint`)

Иконки хранятся как компоненты (`Icon: UserOutlined`), JSX рендерится как `<Icon />`.

---

## API-слой (`api.ts`)

- `request()` — fetch + 401 + ошибки
- `formatDate`, `formatExpiryRemaining`, `canRenewSubscription` (< 24 ч до конца подписки)
- все `fetch*` / `create*` / `delete*` функции

---

## Страницы

### `ProfilePage` (`/profile`)

- Приветствие + аватар
- `XuiClientCard` (variant profile) — подписка
- «Новый счёт» — **только если `canRenew`** (до конца подписки < 24 ч)
- «Мои счета» — `AsyncListState` + `InvoiceCard`
- `AvailableSectionsCard` — ссылки на admin-разделы

### `UsersPage` (`/users`, admin)

- **Левая колонка:** создать user, получить/удалить, действия (токен, роль)
- **Правая колонка:** XUI get/delete, XUI update/reset, список всех users + пагинация

### `PaymentsPage` (`/payments`, admin)

- **Левая колонка:** проверка оплаченных, отмена счёта
- **Правая колонка:** все счета + пагинация

### `MonitoringPage` (`/monitoring`, admin)

- Статус сервисов + ссылки на панели

### Прочие

- `LoginPage` — вход по токену
- `PaymentSuccessPage`, `PaymentFailPage`, `ForbiddenPage` — тонкие обёртки над `ProfileResultPage`

---

## Бизнес-логика вне компонентов

| Логика | Где |
|--------|-----|
| Можно продлить/оплатить (< 24 ч) | `api.ts` → `canRenewSubscription`, ProfilePage + InvoiceCard |
| Удаление user + XUI | backend `UserService.delete` |
| Роли, guard admin | `auth.tsx`, `RequireAdmin`, `types.ts` |
| Тема | `theme/ThemeProvider.tsx`, `theme/config.ts` |
