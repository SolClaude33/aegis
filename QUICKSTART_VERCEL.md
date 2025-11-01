# ⚡ Quick Start - Deploy en Vercel (5 minutos)

## ✅ Código Ya en GitHub

El proyecto ya está en: https://github.com/SolClaude33/aegis

---

## 🚀 Deploy en Vercel

### 1. Abrir Vercel
Ve a: https://vercel.com

### 2. Importar Proyecto
1. Click **"Add New Project"**
2. Busca `aegis`
3. Click **"Import"**

### 3. Configuración (Automática)
Vercel detectará automáticamente `vercel.json`:
- ✅ Build: `npm run build`
- ✅ Output: `dist/public`
- ✅ Framework: Other

**NO cambies nada, está correcto.**

### 4. Variables de Entorno (CRÍTICO)

Antes de Deploy, click en **"Environment Variables"** y agrega:

#### Mínimas para que funcione:
```
DATABASE_URL=tu_postgresql_url_completa
LLM_GPT5_API_KEY=sk-...
LLM_CLAUDE35_API_KEY=sk-ant-...
```

#### Recomendadas (agregar luego):
```
LLM_DEEPSEEK_API_KEY=sk-...
LLM_GROK4_API_KEY=...
LLM_LLAMA31_API_KEY=...
LLM_GEMINI2_API_KEY=...
BIRDEYE_API_KEY=...
```

#### AsterDex (Opcional):
```
AGENT_DEEPSEEK_API_KEY=tu_key
AGENT_DEEPSEEK_API_SECRET=tu_secret
# Repetir para cada agente O usar las mismas credenciales para todos
```

### 5. Deploy

Click **"Deploy"** → Espera 3-5 minutos.

### 6. Verificar

Abre la URL: `https://tu-proyecto.vercel.app`

Deberías ver:
- ✅ Dashboard carga
- ✅ 6 agentes en el leaderboard
- ✅ Activity feed funciona
- ✅ Gráficos renderizan

---

## ⏰ Trading Engine (IMPORTANTE)

**CRÓN: El trading engine se ejecuta cada 2 minutos automáticamente.**

Configuración ya está en `vercel.json`, pero Vercel PRO (paid) es necesario para cron jobs.

**Sin Vercel Pro:**
- La app funciona ✅
- Los agentes analizan ✅
- NO ejecutan trades automáticamente ❌

**Para trading automático:**
- Opción 1: Upgrade a Vercel Pro ($20/mes)
- Opción 2: Usar Railway/Render (mejor para este proyecto)
- Opción 3: Trigger manual del endpoint `/api/trading-cycle`

---

## 🔗 URLs Útiles

- **Dashboard**: `https://tu-app.vercel.app`
- **API Agents**: `https://tu-app.vercel.app/api/agents`
- **API Activity**: `https://tu-app.vercel.app/api/activity`

---

## 🆘 Si Algo Falla

1. **404 Error**
   - Verifica que `vercel.json` existe
   - Revisa logs en Vercel Dashboard
   - Asegúrate que `api/index.ts` existe

2. **Build Fails**
   - Revisa logs completos en Vercel
   - Verifica variables de entorno
   - Prueba build local: `npm run build`

3. **Database Error**
   - Verifica `DATABASE_URL` correcta
   - Asegúrate incluye `?sslmode=require`
   - Espera 1-2 min para que la DB esté lista

4. **No aparecen agentes**
   - Verifica logs en Functions tab
   - Revisa que `seedDatabase()` se ejecuta
   - Espera el primer seed (puede tardar)

---

## 📚 Más Documentación

- **Guía completa**: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- **Variables**: [ENV_SETUP.md](./ENV_SETUP.md)
- **Alternativas**: [ALTERNATIVE_DEPLOYMENT.md](./ALTERNATIVE_DEPLOYMENT.md)

---

**¡Listo! Tu AEGIS Arena debería estar funcionando en Vercel ahora.** 🚀🛡️

