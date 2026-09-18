# NutriFlow

> PWA privada y offline-ready para seguimiento nutricional — calorías, macros, peso, agua, ayuno y ejercicio en un solo lugar.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Sobre el proyecto

NutriFlow es una Progressive Web App para seguimiento nutricional y de salud. Construida con foco en **privacidad**, **funcionamiento offline** y **arquitectura limpia** (principios SOLID).

**Originalmente construida como herramienta personal** para llevar el control diario de comidas, calorías y métricas de salud. Ahora es un proyecto de portafolio y base para una edición personal bilingüe (español/inglés).

### Funcionalidades principales

- 🍽️ **Diario de comidas** — registro por búsqueda, código de barras o entradas personalizadas
- 📊 **Seguimiento de macros** — calorías, proteína, carbos y grasa con adherencia a metas
- ⚖️ **Seguimiento de peso** — gráfica de tendencia + predicción de meta (regresión lineal)
- 💧 **Consumo de agua** — seguimiento diario con botones de acción rápida
- ⏱️ **Ayuno intermitente** — protocolos 16:8, 18:6, 20:4, 24h con temporizador en vivo
- 🏋️ **Registro de ejercicio** — calorías quemadas vía cálculo MET, 27 ejercicios precargados
- 📅 **Plan semanal de comidas** — grid 7×4 + generación de lista de supermercado
- 🍳 **Recetas** — crea recetas reutilizables a partir de ingredientes
- 🎯 **Predicción de metas** — "a este ritmo, alcanzarás tu meta en X días"
- 🏆 **Logros y milestones** — seguimiento motivacional de progreso
- 📈 **Score nutricional** — métrica compuesta (adherencia, variedad, consistencia, hidratación)
- 📄 **Reportes** — exportación PDF + CSV por rango de fechas *(en desarrollo)*
- 🔒 **Privacidad primero** — autenticación por credenciales, sin rastreadores de terceros
- 📱 **PWA** — instalable en iOS y Android, funciona sin conexión

### Estado del proyecto

**Fase 1 de 6 completada.**

- ✅ UI reorganizada en carpetas de responsabilidad única
- ✅ Navegación de 5 pestañas: Hoy | Diario | Progreso | Plan | Reportes
- ✅ Migración de SQLite a Postgres (Neon)
- ⏳ Fase 2 en progreso: búsqueda híbrida por código de barras + soporte de cámara iOS

Ver [docs/ROADMAP.md](docs/ROADMAP.md) para el plan completo de desarrollo.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript 5 |
| UI | React 19, TailwindCSS 4, Radix UI, Lucide |
| Estado | Zustand (cliente), TanStack Query (servidor) |
| Formularios | React Hook Form + Zod |
| Gráficas | Recharts |
| Base de datos | Postgres (Neon) + Prisma 6 |
| Autenticación | NextAuth.js v4 (credenciales + JWT) |
| Hashing | bcrypt (cost 12) |
| Runtime | Bun (dev) / Node 20+ (prod) |
| Deploy | Vercel |

---

## Empezar

### Requisitos previos

- **Bun** ≥ 1.1 — [instalar](https://bun.sh/)
- **Postgres** — local o [Neon](https://neon.tech/) (plan gratis)
- **Node.js** ≥ 20 — solo para producción

### Instalación

```bash
# 1. Clonar
git clone https://github.com/emmanuelmx966/nutriflow.git
cd nutriflow

# 2. Instalar dependencias
bun install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con:
#   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
#   NEXTAUTH_SECRET=<genera uno — ver abajo>
#   NEXTAUTH_URL=http://localhost:3000

# 4. Aplicar el esquema a la base de datos
bun prisma migrate dev

# 5. Poblar datos iniciales (alimentos + ejercicios)
bun run db:seed

# 6. Arrancar el servidor de desarrollo
bun run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Generar `NEXTAUTH_SECRET`

```bash
bun -e "console.log(crypto.randomUUID() + crypto.randomUUID())"
```

Copia el resultado en tu `.env`.

---

## Estructura del proyecto

```
nutriflow/
├── prisma/
│   ├── schema.prisma              # Esquema de base de datos (20+ modelos)
│   ├── migrations/                # Migraciones versionadas
│   └── seed.ts                    # Datos iniciales
├── public/                        # Manifest PWA, iconos, service worker
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # ~44 rutas de API
│   │   ├── layout.tsx
│   │   └── page.tsx               # Router de vistas principal (6 vistas)
│   ├── components/
│   │   ├── app/
│   │   │   ├── views/             # Componentes a nivel de pantalla
│   │   │   │   ├── diary/         # Comidas + ejercicio (8 archivos)
│   │   │   │   ├── progress/      # Peso + logros (5 archivos)
│   │   │   │   ├── plan/          # Plan semanal + recetas (10 archivos)
│   │   │   │   ├── _hidden/       # Removidas de nav, conservadas
│   │   │   │   ├── dashboard.tsx
│   │   │   │   ├── reports.tsx    # Placeholder (Fase 3)
│   │   │   │   └── profile.tsx
│   │   │   └── app-shell.tsx      # Navegación + layout
│   │   └── ui/                    # Primitivas UI (Radix)
│   ├── lib/
│   │   ├── auth/                  # Config NextAuth + bcrypt
│   │   ├── db.ts                  # Cliente Prisma singleton
│   │   ├── services/              # Lógica de negocio (~25 servicios)
│   │   ├── nutrition/             # Calculadoras BMR/TDEE
│   │   ├── security/              # Rate limiting
│   │   ├── validators/            # Esquemas Zod
│   │   └── utils/                 # Helpers de fecha + varios
│   ├── store/                     # Stores de Zustand
│   └── types/                     # Tipos TS compartidos
├── CHANGELOG.md                   # Historial de versiones
└── docs/
    ├── ROADMAP.md                 # Plan de desarrollo en 6 fases
    └── ARCHITECTURE.md            # Decisiones técnicas
```

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para detalles arquitectónicos.

---

## Scripts disponibles

```bash
bun run dev          # Servidor de desarrollo (puerto 3000)
bun run build        # Build de producción
bun run start        # Servidor de producción
bun run lint         # ESLint

bun run db:migrate   # Ejecutar migraciones de Prisma
bun run db:push      # Empujar esquema sin migración (solo dev)
bun run db:reset     # Resetear base de datos (destructivo)
bun run db:seed      # Poblar datos iniciales
bun prisma studio    # Abrir GUI de Prisma Studio
```

---

## Seguridad

- Contraseñas hasheadas con **bcrypt** (factor de costo 12)
- Sesiones vía **JWT** (stateless, cookies HTTP-only, expiración 30 días)
- **Mitigación de timing attack** en login (bcrypt contra hash dummy en fallo)
- **Rate limiting** en endpoints de autenticación (10 intentos / 15 min)
- **Validación Zod** en cada endpoint de API
- **Sin secretos en el cliente** — operaciones sensibles solo en servidor
- El service worker nunca cachea tokens de auth ni datos de usuario
- `.env` en `.gitignore` — los secretos nunca se commitean

---

## PWA

- Instalable en iOS (Safari → Compartir → Añadir a inicio) y Android (Chrome → Instalar app)
- Caché del shell offline vía service worker
- Safe-area insets para el notch de iOS
- `display: standalone` — corre en pantalla completa como app nativa

---

## Autor

**Emmanuel Caballero De La Rosa** ([@emmanuelmx966](https://github.com/emmanuelmx966))

Construido con cariño para alguien que necesitaba una forma más simple y privada de llevar su seguimiento nutricional.

Si este proyecto te resulta útil, considera darle una ⭐ en GitHub.

---

## Licencia

MIT © Emmanuel Caballer De La Rosa — ver [LICENSE](LICENSE).

Eres libre de usar, modificar y distribuir este software.
