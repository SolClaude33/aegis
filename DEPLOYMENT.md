# 🚀 Guía de Deployment Completa para AEGIS Arena

## 📦 Paso 1: Preparar el Proyecto Local

### 1.1 Verificar que todo funciona
```bash
# Instalar dependencias
npm install

# Verificar que compila
npm run build

# Verificar que funciona en local
npm run dev
```

### 1.2 Verificar estructura
Después del build deberías tener:
```
dist/
├── index.js          # Backend bundled
├── public/           # Frontend static
│   ├── index.html
│   └── assets/
```

---

## 📤 Paso 2: Subir a GitHub

### 2.1 Inicializar Git (si no está ya inicializado)
```bash
git init
```

### 2.2 Agregar remoto de GitHub
```bash
git remote add origin https://github.com/SolClaude33/aegis.git
```

### 2.3 Hacer commit inicial
```bash
# Agregar todos los archivos (excepto los ignorados)
git add .

# Verificar qué se va a commitear
git status

# Hacer commit
git commit -m "Initial commit: AEGIS Arena - AI Trading Battle Platform"

# Push a GitHub
git push -u origin main
```

### 2.4 Si ya existe el repo
```bash
# Verificar el remoto
git remote -v

# Pull de cambios existentes
git pull origin main --allow-unrelated-histories

# Agregar tus cambios
git add .

# Commit
git commit -m "Add deployment configuration for Vercel"

# Push
git push origin main
```

---

## 🌐 Paso 3: Deploy en Vercel

### 3.1 Crear cuenta en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Crea cuenta con GitHub
3. Autoriza acceso a repositorios

### 3.2 Importar proyecto
1. Click en **"Add New Project"**
2. Busca `aegis` en tus repositorios
3. Click en **"Import"**

### 3.3 Configurar proyecto

En la pantalla de configuración:

**Framework Preset:** Other (o "None")

**Root Directory:** (déjalo vacío, usa la raíz)

**Build Command:** 
```
npm run build
```

**Output Directory:** 
```
dist/public
```

**Install Command:**
```
npm install
```

### 3.4 Agregar Variables de Entorno

**ANTES** de hacer deploy, click en **"Environment Variables"** y agrega:

#### Obligatorias:
```
DATABASE_URL=tu_url_postgres_completa
```

#### Recomendadas (para que los agentes funcionen):
```
LLM_GPT5_API_KEY=sk-tu_key
LLM_CLAUDE35_API_KEY=sk-ant-tu_key
LLM_DEEPSEEK_API_KEY=sk-tu_key
LLM_GEMINI2_API_KEY=tu_key
LLM_GROK4_API_KEY=tu_key
LLM_LLAMA31_API_KEY=tu_key
```

#### Opcionales:
```
BIRDEYE_API_KEY=tu_key
AGENT_DEEPSEEK_API_KEY=tu_key
AGENT_DEEPSEEK_API_SECRET=tu_secret
# ... repite para cada agente
```

**Para cada variable:**
- Selecciona **Production**, **Preview**, y **Development**
- Click en **"Add"**
- Repite para todas las variables

### 3.5 Hacer Deploy

1. Click en **"Deploy"**
2. Espera 3-5 minutos
3. Vercel te mostrará una URL: `https://tu-proyecto.vercel.app`

---

## ✅ Paso 4: Verificar Deployment

### 4.1 Verificar la página principal
Abre `https://tu-proyecto.vercel.app` en tu navegador:
- ✅ Debe cargar el dashboard
- ✅ No debe mostrar errores en consola (F12 → Console)

### 4.2 Verificar la API
Abre `https://tu-proyecto.vercel.app/api/agents`:
- ✅ Debe devolver JSON con los 6 agentes
- ✅ Cada agente debe tener: id, name, model, currentCapital, etc.

### 4.3 Verificar el Leaderboard
Abre `https://tu-proyecto.vercel.app/leaderboard`:
- ✅ Debe mostrar gráfico de performance
- ✅ Debe listar los 6 contendientes
- ✅ Cada tarjeta debe tener datos

### 4.4 Verificar Activity Feed
- ✅ Debe mostrar eventos de trading
- ✅ Debe actualizar en tiempo real (cada 5 segundos)

---

## 🔧 Paso 5: Configuración Post-Deploy

### 5.1 Configurar Base de Datos

Si no lo hiciste antes, crea una base de datos en Neon:
1. Ve a [neon.tech](https://neon.tech)
2. Crea un nuevo proyecto
3. Copia la connection string
4. Agrega `DATABASE_URL` en Vercel Environment Variables

### 5.2 Inicializar la Base de Datos

Primera vez que se ejecuta, la app se seedeará automáticamente. Si no:
1. Ve a tu base de datos en Neon
2. Abre el SQL Editor
3. Ejecuta las queries del archivo de migración (si es necesario)

### 5.3 Monitorear Logs

En Vercel:
1. Ve a tu proyecto
2. Click en **"Deployments"**
3. Click en el último deployment
4. Click en **"Functions"** para ver logs del backend
5. Observa los logs del trading engine

---

## 🔄 Paso 6: Actualizaciones Futuras

### 6.1 Hacer cambios locales
```bash
# Editar código
# ...

# Probar localmente
npm run dev

# Build local
npm run build
```

### 6.2 Hacer push de cambios
```bash
git add .
git commit -m "Descripción de tus cambios"
git push origin main
```

### 6.3 Vercel deploy automático
- ✅ Vercel detecta automáticamente el push
- ✅ Triggera un nuevo deployment
- ✅ Notifica por email cuando termine

---

## 🆘 Solución de Problemas

### Build Fails en Vercel

**Error: "Cannot find module"**
```
Solución:
1. Verifica que todas las dependencias están en package.json
2. Verifica que @types/* están en devDependencies
3. Revisa los logs de build en Vercel
```

**Error: "Module not found: Can't resolve '@/..."**
```
Solución:
1. Verifica que vite.config.ts tiene los alias correctos
2. Verifica que tsconfig.json tiene los paths correctos
3. Asegúrate de que dist/ se genera correctamente
```

### Runtime Errors

**Error: "Database connection failed"**
```
Solución:
1. Verifica DATABASE_URL en Vercel Settings
2. Asegúrate de que tu DB acepta conexiones remotas
3. Verifica que el SSL está configurado (Neon requiere sslmode=require)
```

**Error: "Missing API credentials"**
```
Solución:
1. Ve a Vercel → Settings → Environment Variables
2. Verifica que TODAS las llaves están agregadas
3. Verifica que están marcadas para Production
4. Haz redeploy
```

**Error: "Port 5000 is already in use"**
```
Solución:
Vercel maneja esto automáticamente. NO configures PORT manualmente.
```

### Trading Engine No Inicia

**Los agentes no están haciendo trades**
```
Verifica en logs:
1. "🌱 Initializing AEGIS Arena with live trading setup..."
2. "✓ Initialized DeepSeek-R1..."
3. "🚀 Trading Engine Started - Live Trading Active"

Si no ves estos logs:
- Verifica que las API keys de LLM son válidas
- Verifica que DATABASE_URL funciona
- Revisa que seedDatabase() se ejecuta correctamente
```

---

## 📊 Monitoreo y Observabilidad

### Vercel Analytics (Opcional)
1. Ve a Settings → Analytics
2. Habilita Vercel Analytics
3. Ve métricas de tráfico y rendimiento

### Logs en Tiempo Real
```bash
# Instalar Vercel CLI
npm i -g vercel

# Ver logs en tiempo real
vercel logs
```

### Monitoreo de Base de Datos
1. Ve a tu dashboard de Neon
2. Monitor → Queries
3. Observa queries lentas o errores

---

## 💰 Optimización de Costos

### Reducir Costos de API
1. Usa modelos más baratos para desarrollo
2. Reduce frecuencia de trading (cada 5 min en lugar de 2)
3. Solo mantén activos 2-3 agentes para pruebas

### Vercel Limits
- Hobby Plan: 100GB bandwidth/mes
- Considera upgrade si tienes mucho tráfico

---

## 🔐 Seguridad

### Best Practices
- ✅ Usa diferentes keys para dev/prod
- ✅ Rota las API keys periódicamente
- ✅ Monitorea uso anómalo
- ✅ Limita IPs en tus APIs si es posible
- ✅ No expongas keys en el frontend

### Secrets Management
Considera usar:
- Vercel Environment Variables (ya lo usas)
- GitHub Secrets (para CI/CD)
- External secret managers (1Password, Vault, etc.)

---

## 📝 Checklist Final

Antes de considerar el deployment completo:

- [ ] Build pasa sin errores
- [ ] Tests locales funcionan
- [ ] README.md actualizado
- [ ] .gitignore configurado correctamente
- [ ] Variables de entorno documentadas
- [ ] Database migrado y seedeado
- [ ] Trading engine inicia correctamente
- [ ] Frontend carga sin errores
- [ ] API responde correctamente
- [ ] Activity feed actualiza en tiempo real
- [ ] Leaderboard muestra datos
- [ ] Logs están accesibles
- [ ] Monitoreo configurado
- [ ] Documentación actualizada

---

## 🎉 ¡Listo!

Si todos los checks pasan, tu deployment está completo. El proyecto debería estar corriendo en:
- URL Principal: `https://tu-proyecto.vercel.app`
- API Base: `https://tu-proyecto.vercel.app/api`
- Docs: Lee README.md para más información

**¡Los agentes están listos para la batalla!** 🛡️🤖
