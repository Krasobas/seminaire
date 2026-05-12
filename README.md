# Séminaire Orthodoxe Russe Sainte-Geneviève

Сайт семинарии — Astro SSR + Strapi CMS + nginx.

## Архитектура

```
Внешний прокси (SSL)
    │
    ▼
nginx (:80)                ← сеть proxy
    ├── /admin, /api  → Strapi (:1337)  ← сеть internal
    └── /*            → Astro (:4321)   ← сеть internal
```

- **Astro** — SSR-фронтенд, читает контент из Strapi API
- **Strapi** — CMS, админка на `/admin`, SQLite-база
- **nginx** — реверс-прокси, маршрутизирует запросы

## Структура проекта

```
seminaire-orthodoxe/
├── src/                          # Astro фронтенд
│   ├── components/               # Секции страницы
│   │   ├── Header.astro          # Навигация + переключатель тем
│   │   ├── Hero.astro            # Главная секция
│   │   ├── NewsSection.astro     # Actualités (из Strapi)
│   │   ├── LiturgySection.astro  # Vie liturgique (из Strapi)
│   │   ├── EmissionSection.astro # Questions du cœur (из Strapi)
│   │   ├── AdmissionsBanner.astro
│   │   ├── VisitSection.astro
│   │   ├── DonateSection.astro
│   │   └── Footer.astro
│   ├── layouts/BaseLayout.astro  # HTML-оболочка, темы, анимации
│   ├── lib/strapi.ts             # API-клиент для Strapi
│   ├── pages/index.astro         # Главная страница
│   └── styles/global.css         # 5 тем через CSS-переменные
├── public/
│   └── logo.svg                  # Логотип семинарии
├── strapi/                       # CMS
│   ├── config/
│   │   ├── database.js           # SQLite
│   │   ├── middlewares.js        # CORS
│   │   └── api.js
│   ├── src/api/
│   │   ├── article/              # Новости
│   │   ├── episode/              # Эпизоды «Questions du cœur»
│   │   ├── liturgy-schedule/     # Расписание богослужений
│   │   ├── page/                 # Статические страницы
│   │   └── site-setting/         # Глобальные настройки (single type)
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── Dockerfile                    # Astro SSR → Node server
├── nginx.conf
├── Jenkinsfile
├── .env.example
└── .gitignore
```

## Темы

5 тем, переключаемых посетителем:

| Тема | data-theme | Описание |
|---|---|---|
| Светлая | `light` | По умолчанию |
| Тёмная | `dark` | |
| Великопостная | `lent` | Лиловые акценты |
| Пасхальная | `pascha` | Красные акценты |
| Рождественская | `christmas` | Зелёно-золотые акценты |

Переключатель в навбаре. Выбор сохраняется в localStorage.

## Деплой через Jenkins

### 1. Создать Docker-сеть

```bash
docker network create proxy
```

### 2. Добавить секреты в Jenkins .env

```bash
cat >> /path/to/jenkins.env <<EOF

# Séminaire Orthodoxe — Strapi
SEMINAIRE_STRAPI_APP_KEYS=$(for i in 1 2 3 4; do openssl rand -base64 32; done | paste -sd',')
SEMINAIRE_STRAPI_API_TOKEN_SALT=$(openssl rand -base64 32)
SEMINAIRE_STRAPI_ADMIN_JWT_SECRET=$(openssl rand -base64 32)
SEMINAIRE_STRAPI_TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
SEMINAIRE_STRAPI_JWT_SECRET=$(openssl rand -base64 32)
SEMINAIRE_STRAPI_API_TOKEN=
SEMINAIRE_FRONTEND_URL=https://seminaire-orthodoxe.fr
EOF
```

### 3. Добавить credentials в Jenkins YAML

См. `jenkins-config-with-seminaire.yaml` — блок `# --- Séminaire Orthodoxe ---`.

### 4. Запустить пайплайн

Jenkins соберёт образы и поднимет контейнеры через `docker-compose up -d`.

## Первый запуск Strapi

1. Зайти на `https://<домен>/admin`
2. Создать администратора
3. Settings → Roles → **Public** → включить `find` / `findOne` для: article, episode, liturgy-schedule, page, site-setting
4. Добавить контент через админку

### API-токен (опционально)

1. Settings → API Tokens → Create → Read-only
2. Скопировать токен
3. Добавить в Jenkins .env: `SEMINAIRE_STRAPI_API_TOKEN=<токен>`
4. Перезапустить пайплайн

## Миграция на другую VM

```bash
# На старой VM
tar czf seminaire-data.tar.gz data/

# На новой VM
tar xzf seminaire-data.tar.gz
```

Папка `data/` содержит SQLite-базу и загруженные файлы.

## Локальная разработка

```bash
# Установить зависимости
npm install

# Запустить Astro dev-сервер
npm run dev

# Strapi — отдельно
cd strapi && npm install && npm run develop
```

Скопировать `.env.example` в `.env` и заполнить значения.

## Контент-тайпы Strapi

### Article (новости)
- `title` — string, required
- `slug` — uid (from title)
- `excerpt` — text
- `content` — richtext
- `category` — enumeration: actualité, liturgie, formation, événement, pèlerinage
- `featured` — boolean
- `image` — media

### Episode (Questions du cœur)
- `title` — string, required
- `slug` — uid
- `description` — text
- `youtubeUrl` — string
- `season` — integer
- `episodeNumber` — integer
- `thumbnail` — media

### Liturgy Schedule (богослужения)
- `title` — string, required
- `date` — datetime
- `time` — string
- `location` — string
- `type` — enumeration: divine liturgy, vespers, matins, moleben, panikhida, other
- `description` — text

### Page (статические страницы)
- `title` — string, required
- `slug` — uid
- `content` — richtext

### Site Setting (глобальные настройки, single type)
- `siteName` — string
- `siteDescription` — text
- `address` — text
- `phone` — string
- `email` — email
- `youtubeChannel` — string
- `telegramChannel` — string
