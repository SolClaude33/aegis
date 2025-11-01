# 🌐 Deployment en Vercel - AEGIS Arena

## ⚠️ Configuración Especial para Vercel

Este proyecto está configurado para funcionar en **Vercel** usando serverless functions.

**IMPORTANTE**: El trading engine usa Vercel Cron Jobs que ejecutan cada 2 minutos. Configura esto DESPUÉS del primer deploy.

---

## 📋 Pasos de Deployment

### 1. Push a GitHub
Ya tienes el código en GitHub: https://github.com/SolClaude33/aegis

### 2. Importar en Vercel
1. Ve a https://vercel.com
2. Click **"Add New Project"**
3. Importa `SolClaude33/aegis`

### 3. Configuración del Proyecto

**IMPORTANTE - NO uses las configuraciones sugeridas automáticamente:**

- **Framework Preset**: Dejar en blanco o "Other"
- **Root Directory**: `./` (raíz del proyecto)
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### 4. Variables de Entorno

Click en **"Environment Variables"** y agrega:

#### Base de Datos (REQUERIDO)
```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

#### LLM Keys (Recomendado)
```
LLM_DEEPSEEK_API_KEY=tu_key
LLM_GPT5_API_KEY=tu_key
LLM_CLAUDE35_API_KEY=tu_key
LLM_GROK4_API_KEY=tu_key
LLM_LLAMA31_API_KEY=tu_key
LLM_GEMINI2_API_KEY=tu_key
```

#### AsterDex (Opcional para trading real)
```
AGENT_DEEPSEEK_API_KEY=tu_key
AGENT_DEEPSEEK_API_SECRET=tu_secret
# ... repetir para cada agente
```

#### Otros
```
BIRDEYE_API_KEY=tu_key
NODE_ENV=production
```

### 5. Deploy

Click en **"Deploy"** y espera 3-5 minutos.

### 6. Configurar Vercel Cron (CRÍTICO)

El trading engine necesita ejecutarse cada 2 minutos:

1. Ve a tu proyecto en Vercel Dashboard
2. Click en **"Settings"** → **"Cron Jobs"**
3. Click **"Add Cron Job"**
4. Configura:
   - **Path**: `/api/trading-cycle`
   - **Schedule**: `*/2 * * * *` (cada 2 minutos)
   - **Timezone**: UTC

**SIN esto, los agentes NO harán trades automáticamente.**

---

## 🏗️ Cómo Funciona en Vercel

### Estructura Serverless

```
api/
├── index.ts          # Handler principal - todas las rutas
├── trading-cycle.ts  # Cron job para trading engine
└── ...

dist/
├── public/           # Frontend static files
│   ├── index.html
│   └── assets/
└── index.js          # Backend bundle (no usado en Vercel)
```

### Rutas

- `/api/*` → `api/index.ts` → Express app
- `/*` → `api/index.ts` → Express app → sirve static files

---

## 🆘 Troubleshooting

### Error 404 en todas las rutas

**Problema**: `vercel.json` no configurado correctamente

**Solución**: Verifica que `vercel.json` existe con:
```json
{
  "rewrites": [...]
}
```

### Error: "Cannot find module '../server/routes'"

**Problema**: Vercel no encuentra los imports

**Solución**: Asegúrate que `buildCommand` es `npm run build`

### Trading engine no ejecuta

**Problema**: Cron job no configurado

**Solución**: Configura el cron job en Settings → Cron Jobs

### Database connection fails

**Problema**: `DATABASE_URL` incorrecta o DB no accesible

**Solución**: Verifica que la URL incluye `?sslmode=require`

---

## 📝 Variables de Entorno Completas

Ver lista completa en: `ENV_SETUP.md`

---

## ⚡ Deploy Rápido

Si ya tienes todo configurado:

```bash
# En Vercel dashboard
1. New Project → Import from GitHub
2. Select `SolClaude33/aegis`
3. Add environment variables
4. Deploy
5. Configure Cron Job
```

**¡Listo!** 🚀

---

## 🔄 Auto-Deploy

Vercel hace auto-deploy con cada push a `main` branch.

---

## 💰 Límites de Vercel

### Free Tier
- 100 GB bandwidth
- 100 GB-hours build time
- Serverless functions: Bueno para APIs

### Consideraciones
- Trading engine con cron: ✅ Funciona
- Long-running connections: ❌ No soportado
- Persistent state: Usar DB externa (PostgreSQL)

---

**¿Dudas? Revisa los logs en Vercel Dashboard → Deployments**

