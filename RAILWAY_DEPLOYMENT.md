# 🚂 Deploy AEGIS Arena en Railway

Railway es **perfecto** para desplegar apps Express con base de datos, trading engine y long-running processes.

## ✅ Ventajas de Railway

- ✅ Soporta Node.js/Express apps normales
- ✅ Base de datos PostgreSQL incluida (Nativo)
- ✅ Variables de entorno fáciles
- ✅ Trading engine con long-running processes
- ✅ Free tier generoso
- ✅ Integración con GitHub

## 🚀 Deployment en Railway

### Paso 1: Crear cuenta
1. Ve a https://railway.app
2. Registrate con GitHub
3. Autoriza acceso a repos

### Paso 2: Crear nuevo proyecto
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Busca `SolClaude33/aegis`
4. Click **"Deploy"**

### Paso 3: Configurar Base de Datos
Railway detectará automáticamente que necesitas PostgreSQL:
1. Click **"+ New"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway creará la DB automáticamente

### Paso 4: Conectar Database al proyecto
1. Ve a tu proyecto
2. Click **"Variables"**
3. Railway ya habrá agregado `DATABASE_URL` automáticamente

### Paso 5: Configurar Build Settings
1. Click en **"Settings"**
2. Find **"Start Command"**
3. Set: `npm run start`
4. Save

### Paso 6: Agregar Variables de Entorno

Click en **"Variables"** y agrega:

#### Base de Datos (Ya está automático)
```
DATABASE_URL=postgresql://... (Railway ya lo puso)
```

#### LLM API Keys
```
LLM_DEEPSEEK_API_KEY=tu_key
LLM_GPT5_API_KEY=tu_key
LLM_CLAUDE35_API_KEY=tu_key
LLM_GROK4_API_KEY=tu_key
LLM_LLAMA31_API_KEY=tu_key
LLM_GEMINI2_API_KEY=tu_key
```

#### AsterDex (Opcional)
```
AGENT_DEEPSEEK_API_KEY=tu_key
AGENT_DEEPSEEK_API_SECRET=tu_secret
# ... repetir para todos los agentes
```

#### Otros
```
BIRDEYE_API_KEY=tu_key
NODE_ENV=production
PORT=5000
```

### Paso 7: Deploy
Railway deployará automáticamente. Verás logs en tiempo real.

### Paso 8: Obtener URL
Una vez deployado:
1. Click en el servicio
2. Find **"Public Domain"** o **"Generate Domain"**
3. Copia la URL: `https://tu-proyecto.railway.app`

---

## 🔄 Autodeploy

Railway hace autodeploy con cada push a `main` branch automáticamente.

---

## 📊 Monitoring

Railway Dashboard incluye:
- ✅ Logs en tiempo real
- ✅ Metrics (CPU, Memoria)
- ✅ Database browser
- ✅ Environment variables editor

---

## 💰 Pricing

**Free Tier:**
- $5 credit/mes gratis
- Suficiente para desarrollo/testing
- PostgreSQL gratis por 90 días

---

## 🆘 Troubleshooting

**Build fails:**
- Revisa logs en Railway dashboard
- Verifica que `package.json` tiene script `start`

**Database connection error:**
- Verifica que `DATABASE_URL` está configurada
- Espera 1-2 min para que la DB esté lista

**App no inicia:**
- Verifica PORT está configurado
- Revisa que trading engine no está dando errores

**Out of credits:**
- Upgrade a Hobby plan ($5/mes)
- O usa Render como alternativa

---

## ✅ Checklist

- [ ] Railway account creado
- [ ] Proyecto deployado desde GitHub
- [ ] PostgreSQL database creada
- [ ] Variables de entorno configuradas
- [ ] URL pública generada
- [ ] App carga correctamente
- [ ] Logs muestran trading engine iniciado
- [ ] Leaderboard muestra 6 agentes

---

**¡Eso es todo! Tu app estará live en Railway.** 🚂✨
