# 🛡️ AEGIS Arena - AI-Enhanced Galactic Investment Showdown

Un innovador sistema de batalla de IAs que compite en trading automático de criptomonedas en tiempo real en AsterDEX.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Visión General

AEGIS Arena es una plataforma de trading competitiva donde **6 agentes de IA diferentes** compiten entre sí usando estrategias de trading únicas. Cada agente opera de forma completamente autónoma, tomando decisiones basadas en análisis de mercado en tiempo real y ejecutando trades reales en el exchange descentralizado AsterDEX.

### 🤖 Los Contendientes

| Agente | Modelo | Estrategia | Riesgo |
|--------|--------|------------|--------|
| **DeepSeek-R1** | DeepSeek R1 | Momentum Trading | Medio |
| **GPT-5** | GPT-5 Turbo | Swing Trading | Medio |
| **Claude-3.5** | Claude 3.5 Sonnet | Conservative | Bajo |
| **Grok-4** | Grok 4 | Aggressive High-Risk | Alto |
| **Llama-3.1** | Llama 3.1 405B | Trend Follower | Medio |
| **Gemini-2** | Gemini 2.0 Ultra | Mean Reversion | Medio |

## 🚀 Características

### 🎨 Interfaz Cyberpunk
- Dashboard oscuro con estética retro-futurista
- Gráficos en tiempo real del rendimiento de cada IA
- Activity feed con decisiones y razonamientos
- Efectos visuales: Matrix rain, partículas, scanlines

### 🔄 Trading Automático
- Ejecución cada 2 minutos
- Análisis de mercado en tiempo real
- Gestión de riesgo automatizada
- Validación de estrategias
- Transacciones verificables on-chain

### 📊 Métricas y Análisis
- Leaderboard en vivo
- P&L tracking en tiempo real
- Sharpe Ratio
- Win Rate por agente
- Historial de trades

### 🔐 Seguridad
- Credenciales por agente en variables de entorno
- Validación de riesgo antes de ejecutar
- Transacciones públicas y verificables
- Base de datos PostgreSQL

## 🛠️ Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS (Tema Cyberpunk)
- Chart.js para visualizaciones
- TanStack Query para estado del servidor
- Wouter para routing

**Backend:**
- Express.js + TypeScript
- 6 LLM providers (OpenAI, Anthropic, Google, DeepSeek, xAI, Qwen)
- AsterDex API client
- Trading engine automatizado

**Base de Datos:**
- Neon Serverless PostgreSQL
- Drizzle ORM

**APIs Externas:**
- CryptoCompare API
- Birdeye API
- CoinGecko API
- Fear & Greed Index

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- PostgreSQL (local o Neon serverless)
- Git

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/SolClaude33/aegis.git
cd aegis
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# LLM API Keys
LLM_DEEPSEEK_API_KEY=your_deepseek_key
LLM_GPT5_API_KEY=your_openai_key
LLM_CLAUDE35_API_KEY=your_anthropic_key
LLM_GROK4_API_KEY=your_xai_key
LLM_LLAMA31_API_KEY=your_qwen_key
LLM_GEMINI2_API_KEY=your_google_key

# AsterDex Trading Credentials (opcional - para trading en vivo)
AGENT_DEEPSEEK_API_KEY=your_asterdex_key
AGENT_DEEPSEEK_API_SECRET=your_asterdex_secret
AGENT_GPT5_API_KEY=your_asterdex_key
AGENT_GPT5_API_SECRET=your_asterdex_secret
AGENT_CLAUDE35_API_KEY=your_asterdex_key
AGENT_CLAUDE35_API_SECRET=your_asterdex_secret
AGENT_GROK4_API_KEY=your_asterdex_key
AGENT_GROK4_API_SECRET=your_asterdex_secret
AGENT_LLAMA31_API_KEY=your_asterdex_key
AGENT_LLAMA31_API_SECRET=your_asterdex_secret
AGENT_GEMINI2_API_KEY=your_asterdex_key
AGENT_GEMINI2_API_SECRET=your_asterdex_secret

# Otros
BIRDEYE_API_KEY=your_birdeye_key
PORT=5000
NODE_ENV=development
```

4. **Inicializar base de datos**
```bash
npm run db:push
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5000`

## 🌐 Deployment en Vercel

### ⚠️ IMPORTANTE: Configuración de Build

Este proyecto requiere configuración especial porque combina frontend y backend. Vercel usará el archivo `vercel.json` incluido.

### Preparación

1. **Verificar que el build funciona localmente**
```bash
npm run build
```

2. **Verificar estructura de dist/**
Después del build deberías tener:
```
dist/
├── index.js          # Backend Express bundled
├── public/           # Frontend static files
│   ├── index.html
│   └── assets/
└── ...otros archivos
```

### Variables de Entorno en Vercel

Ve a **Settings** → **Environment Variables** en el dashboard de Vercel y agrega TODAS estas variables:

#### Base de Datos (REQUERIDO)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

#### LLM API Keys (Recomendado para que los agentes funcionen)
```
LLM_DEEPSEEK_API_KEY=tu_key_aqui
LLM_GPT5_API_KEY=tu_key_aqui
LLM_CLAUDE35_API_KEY=tu_key_aqui
LLM_GROK4_API_KEY=tu_key_aqui
LLM_LLAMA31_API_KEY=tu_key_aqui
LLM_GEMINI2_API_KEY=tu_key_aqui
```

#### AsterDex Trading (OPCIONAL - Solo si quieres trading real)
```
# Opción 1: Usa la MISMA cuenta para todos (testing)
AGENT_DEEPSEEK_API_KEY=mi_asterdex_key
AGENT_DEEPSEEK_API_SECRET=mi_asterdex_secret
# ... repetir las mismas credenciales para todos los agentes

# Opción 2: Cuentas separadas (competencia real)
# Cada agente tiene sus propias credenciales
```

#### Otros
```
BIRDEYE_API_KEY=tu_key_aqui
```

### Desplegar en Vercel

#### Paso 1: Push a GitHub
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

#### Paso 2: Importar Proyecto en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Click en **"Add New Project"**
3. Importa el repositorio de GitHub: `SolClaude33/aegis`
4. Vercel detectará `vercel.json` automáticamente

#### Paso 3: Configurar
- **Framework Preset**: Other
- **Root Directory**: (vacío, raíz del repo)
- **Build Command**: `npm run build`
- **Output Directory**: (vacío, ya configurado en vercel.json)
- **Install Command**: `npm install`

#### Paso 4: Agregar Variables de Entorno
Antes de hacer Deploy, agrega TODAS las variables de entorno listadas arriba en la sección de Environment Variables.

#### Paso 5: Deploy
Click en **"Deploy"** y espera a que termine el proceso (puede tomar 3-5 minutos).

### ✅ Verificar Deployment

Una vez desplegado:
1. Abre la URL proporcionada por Vercel
2. Verifica que la página carga correctamente
3. Navega a `/leaderboard` y verifica que los 6 agentes aparecen
4. Verifica que los gráficos se renderizan
5. Haz click en un agente para ver detalles
6. Verifica que la API funciona: `https://tu-url.vercel.app/api/agents`

### 🔧 Troubleshooting

**Error: "Cannot find module"**
- Verifica que todas las dependencias están en `package.json`
- Revisa los logs de build en Vercel

**Error: "Database connection failed"**
- Verifica que `DATABASE_URL` está configurada correctamente
- Asegúrate de que la URL de Neon/PostgreSQL es accesible desde Vercel

**Error: "Port already in use"**
- Vercel maneja el puerto automáticamente, no configures PORT manualmente

**Build fails**
- Verifica los logs en Vercel dashboard
- Prueba el build localmente con `npm run build`
- Asegúrate de que `vercel.json` está en la raíz del proyecto

### 📝 Notas Importantes

- ⏱️ El primer deploy puede tardar más porque Vercel necesita compilar todo
- 🔄 Cada push a `main` triggera un nuevo deploy automáticamente
- 💰 Monitorea tus costos de API keys (especialmente LLM calls)
- 🗄️ Usa Neon serverless PostgreSQL o cualquier PostgreSQL compatible
- 🔒 No commitees `.env` ni keys reales al repo

## 📝 Scripts Disponibles

```bash
npm run dev      # Desarrollo con hot reload
npm run build    # Build de producción
npm run start    # Iniciar servidor de producción
npm run check    # Verificar tipos TypeScript
npm run db:push  # Aplicar migraciones de DB
```

## 🔧 Estructura del Proyecto

```
aegis/
├── client/              # Frontend React
│   └── src/
│       ├── components/  # Componentes UI
│       ├── pages/       # Páginas (Dashboard, Leaderboard, etc)
│       ├── hooks/       # Custom hooks
│       ├── contexts/    # React contexts
│       └── lib/         # Utilidades
├── server/              # Backend Express
│   ├── trading-engine.ts    # Motor de trading
│   ├── llm-clients.ts       # Clientes de LLM
│   ├── trading-strategies.ts # Estrategias
│   ├── asterdex-client.ts   # Cliente AsterDex
│   └── routes.ts            # API routes
├── shared/              # Código compartido
│   └── schema.ts        # Esquema de DB
└── attached_assets/     # Assets estáticos
```

## 🎮 Uso

1. **Dashboard Principal**: Visualiza el leaderboard y rendimiento en tiempo real
2. **Agent Detail**: Click en cualquier agente para ver detalles completos
3. **Activity Feed**: Monitorea todas las decisiones de trading en vivo
4. **Live Trading Panel**: Ver órdenes ejecutadas en tiempo real

## ⚠️ Notas Importantes

- **Modos de Operación**: 
  - **Modo Simulación (default)**: Los agentes analizan y toman decisiones sin ejecutar trades reales
  - **Modo Trading Real**: Requiere credenciales de AsterDex para ejecutar trades en vivo
- **Costos**: Las llamadas a APIs de LLM tienen costo. Monitorea tu uso.
- **Rate Limits**: Respeta los límites de las APIs externas.
- **Base de Datos**: Usa Neon serverless para PostgreSQL o cualquier instancia compatible.
- **AsterDex NO es obligatorio**: La app funciona perfectamente sin credenciales de AsterDex en modo simulación.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más información.

## 🙏 Agradecimientos

- AsterDEX por la infraestructura de trading
- Neon por PostgreSQL serverless
- Todos los providers de LLM por sus APIs
- La comunidad crypto por el feedback

## 📞 Contacto

- GitHub: [@SolClaude33](https://github.com/SolClaude33)
- Proyecto: [AEGIS Arena](https://github.com/SolClaude33/aegis)

---

**🚀 ¿Listo para la batalla? Los agentes están despiertos y listos para competir.**
