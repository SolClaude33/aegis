# 🚀 Guía de Deployment para AEGIS Arena

## ⚠️ Importante: Vercel vs Railway/Render

**AEGIS Arena** es una app **full-stack con Express y long-running processes** (trading engine).

### ❌ Vercel NO es compatible porque:
- Solo soporta **serverless functions** (10 seg max)
- Trading engine corre **24/7** cada 2 minutos
- Necesita **persistent connections**
- Express server tradicional no encaja bien

### ✅ Alternativas Recomendadas:

#### 1. **Railway.app** ⭐ (Recomendado)
- **Free tier**: $5 credit/mes
- PostgreSQL nativo incluido
- Long-running processes OK
- GitHub auto-deploy
- **[Ver guía completa →](./RAILWAY_DEPLOYMENT.md)**

#### 2. **Render.com**
- **Free tier**: 750 horas/mes
- PostgreSQL externo
- Long-running processes OK
- GitHub auto-deploy

#### 3. **Replit**
- Ya tienes la app corriendo ahí
- Perfecto para testing
- Free tier generoso

---

## 🚂 Quick Start con Railway

### Paso 1: Deploy
1. Ve a https://railway.app
2. **"New Project"** → **"Deploy from GitHub"**
3. Selecciona tu repo: `SolClaude33/aegis`
4. Railway detecta y configura automáticamente

### Paso 2: Database
1. Railway crea PostgreSQL automáticamente
2. Variable `DATABASE_URL` configurada automáticamente

### Paso 3: Environment Variables
En Railway dashboard → Variables, agrega:

```bash
DATABASE_URL=# Railway ya lo puso

LLM_GPT5_API_KEY=tu_key
LLM_CLAUDE35_API_KEY=tu_key
LLM_DEEPSEEK_API_KEY=tu_key

NODE_ENV=production
PORT=5000
```

### Paso 4: Build Settings
En Railway Settings → Start Command:
```
npm run start
```

### Paso 5: ¡Listo!
Railway hace deploy automáticamente. URL: `https://tu-app.railway.app`

---

## 📖 Documentación Completa

- **Railway**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
- **Environment Variables**: [ENV_SETUP.md](./ENV_SETUP.md)
- **General Setup**: [README.md](./README.md)

---

## 🆘 Si quieres intentar Vercel de todas formas

Vercel **puede funcionar** si:
1. Separas el trading engine a un servicio separado (Railway)
2. Solo despliegas el frontend + API en Vercel
3. Llamas al trading engine desde Vercel a Railway

Esto requiere **más configuración** y **2 servicios separados**.

**Recomendación**: Usa Railway que funciona todo de una vez. 🚂

---

**¿Listo? Railway es la mejor opción para este proyecto.** ✨
