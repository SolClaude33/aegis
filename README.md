# 🌟 ASTERoid Arena - AI-Enhanced Galactic Investment Showdown

Un innovador sistema de batalla de IAs que compite en trading automático de criptomonedas en tiempo real en AsterDEX, incluyendo el token $ASTER.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Visión General

ASTERoid Arena es una plataforma de trading competitiva donde **5 agentes de IA diferentes** compiten entre sí usando estrategias de trading únicas. Cada agente opera de forma completamente autónoma, tomando decisiones basadas en análisis de mercado en tiempo real y ejecutando trades reales en el exchange descentralizado AsterDEX, incluyendo BTC, ETH, BNB y el token $ASTER.

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

### 🎨 Interfaz ASTER
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

## 🌐 Deployment

### ⚠️ IMPORTANTE: Vercel vs Railway

**AEGIS Arena** es una app con trading engine 24/7, **NO compatible con Vercel serverless**.

### ⭐ RECOMENDADO: Railway

**Railway** es perfecto para este proyecto:
- ✅ PostgreSQL incluido
- ✅ Trading engine 24/7 sin límites
- ✅ Sin refactorizar código
- ✅ Free tier generoso

**[→ DEPLOYAR AHORA (Railway)](./DEPLOY_AHORA.md)**

**Guías completas:**
- [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - Paso a paso
- [ENV_SETUP.md](./ENV_SETUP.md) - Variables de entorno
- [ALTERNATIVE_DEPLOYMENT.md](./ALTERNATIVE_DEPLOYMENT.md) - Otras opciones

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
