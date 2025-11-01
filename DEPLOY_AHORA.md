# 🚀 DEPLOYAR AEGIS ARENA AHORA

## ⚡ Railway (5 minutos) - RECOMENDADO ⭐

Railway es PERFECTO para tu app porque:
- ✅ Soporta trading engine 24/7
- ✅ PostgreSQL incluido
- ✅ Sin refactorizar código
- ✅ Free tier generoso

### Pasos:

1. **Ve a https://railway.app**
2. **"Login with GitHub"**
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Selecciona **`SolClaude33/aegis`**
5. Click **"Deploy"**

Railway automáticamente:
- ✅ Crea PostgreSQL
- ✅ Configura `DATABASE_URL`
- ✅ Detecta Node.js
- ✅ Correr `npm install && npm run start`

6. **Agregar variables de entorno:**

Click en **"Variables"** y agrega:

```bash
# DATABASE_URL ya está automático ✅

LLM_DEEPSEEK_API_KEY=tu_key
LLM_GPT5_API_KEY=tu_key
LLM_CLAUDE35_API_KEY=tu_key
LLM_GROK4_API_KEY=tu_key
LLM_LLAMA31_API_KEY=tu_key
LLM_GEMINI2_API_KEY=tu_key

AGENT_DEEPSEEK_API_KEY=tu_asterdex_key
AGENT_DEEPSEEK_API_SECRET=tu_asterdex_secret
AGENT_GPT5_API_KEY=tu_asterdex_key
AGENT_GPT5_API_SECRET=tu_asterdex_secret
AGENT_CLAUDE35_API_KEY=tu_asterdex_key
AGENT_CLAUDE35_API_SECRET=tu_asterdex_secret
AGENT_GROK4_API_KEY=tu_asterdex_key
AGENT_GROK4_API_SECRET=tu_asterdex_secret
AGENT_LLAMA31_API_KEY=tu_asterdex_key
AGENT_LLAMA31_API_SECRET=tu_asterdex_secret
AGENT_GEMINI2_API_KEY=tu_asterdex_key
AGENT_GEMINI2_API_SECRET=tu_asterdex_secret

NODE_ENV=production
PORT=5000
```

7. **¡Listo!** Railway te da una URL como: `https://aegis.up.railway.app`

---

## 🆘 Si quieres Vercel (NO recomendado)

Vercel requiere refactorizar TODO el código a serverless. Necesitas:
- Separar cada endpoint en su propia función
- Eliminar trading engine (o correrlo cada vez manualmente)
- Reescribir mucho código

**Mejor usa Railway** 🚂

---

## 📚 Documentación

- Railway: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- Variables: [ENV_SETUP.md](./ENV_SETUP.md)
- Alternativas: [ALTERNATIVE_DEPLOYMENT.md](./ALTERNATIVE_DEPLOYMENT.md)

