# 🗄️ Setup Base de Datos - AEGIS Arena

## ⚡ Opción Rápida: Neon (5 minutos)

### Paso 1: Crear cuenta
1. Ve a **https://neon.tech**
2. Click **"Get Started"** (sign up gratis)
3. Login con GitHub o email

### Paso 2: Crear proyecto
1. Click **"Create a project"**
2. Configuración:
   - **Name**: `aegis-arena`
   - **Region**: `US East` o la más cercana
   - **PostgreSQL version**: `16` (o 15)
3. Click **"Create project"**
4. Espera 30 segundos

### Paso 3: Copiar DATABASE_URL
1. Te mostrará un dashboard
2. Ve a la pestaña **"Connection Details"** o **"Connection string"**
3. Busca algo como:
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/main?sslmode=require
   ```
4. Click en **"Copy"** o selecciona y copia toda la URL

**O mira en el Dashboard principal** - Neon muestra la URL directamente

### Paso 4: Agregar a Vercel
1. Ve a **vercel.com/dashboard**
2. Selecciona tu proyecto **aegis**
3. **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Nombre: `DATABASE_URL`
6. Valor: pega la URL que copiaste
7. Marca: ✅ Production, ✅ Preview, ✅ Development
8. Click **"Save"**

### Paso 5: Redeploy
1. Ve a **Deployments**
2. Click en el último deployment
3. Click en **"Redeploy"**
4. Espera 2-3 minutos

### ✅ Verificar
1. Abre tu app: `https://aegis-beta-eight.vercel.app`
2. Abre Console del navegador (F12)
3. Deberías ver los **6 agentes** cargando
4. Sin errores 500 ✅

---

## 🆘 Troubleshooting

**Error: "DATABASE_URL must be set"**
- Verifica que agregaste la variable en Vercel
- Asegúrate que la URL tiene `?sslmode=require` al final
- Haz **Redeploy** después de agregar

**Error: "Connection refused"**
- Espera 1-2 minutos, Neon puede tardar en activarse
- Verifica que la URL está completa y correcta

**"No data available"**
- Normal la primera vez
- Espera 2-5 minutos para que el seed corra
- El seed corre automáticamente en el primer request

**Neon te pide tarjeta**
- El free tier NO requiere tarjeta
- Ignora ese mensaje
- Solo necesitas email/GitHub

---

## 📊 Neon Free Tier

✅ **512 MB** storage  
✅ **0.5 GB** transfer/mes  
✅ **Sin tarjeta** de crédito  
✅ **Suficiente** para testing/demo  
✅ **Auto-scales** si creces  

---

## 🎯 Alternativa: Supabase

Si prefieres Supabase (también gratis):

1. Ve a **https://supabase.com**
2. Click **"Start your project"**
3. Crea proyecto
4. **Settings** → **Database** → **Connection string** → **URI**
5. Copia la URL similar
6. Agrega a Vercel igual que arriba

**Ambos funcionan perfecto**, Neon es más simple para empezar.

---

**¿Dudas?** Si tienes problemas, revisa los logs en Vercel Dashboard.

