# 🗄️ Cómo Obtener tu DATABASE_URL

## ⚡ Quick Setup (5 minutos)

### Opción 1: Neon Serverless (Recomendado para Vercel)

1. Ve a **https://neon.tech**
2. Click en **"Sign Up"** (gratis)
3. Crea un **nuevo proyecto**
   - Nombre: `aegis-arena`
   - Region: Elige la más cercana
   - PostgreSQL version: 15 o 16
4. Espera a que cree la DB (30 segundos)
5. Click en **"Connection string"**
6. Copia la URL que dice: `postgresql://user:pass@host.neon.tech:5432/main`

### ⚠️ IMPORTANTE: Agregar SSL

La URL que te da Neon YA incluye `?sslmode=require`, pero asegúrate que sea:

```
postgresql://user:pass@host.neon.tech:5432/main?sslmode=require
```

Si no tiene `?sslmode=require`, agrégalo al final.

---

### Opción 2: Supabase (Alternativa gratis)

1. Ve a **https://supabase.com**
2. Click **"Start your project"**
3. Crea cuenta (gratis)
4. Crea nuevo proyecto
5. Ve a **Settings** → **Database**
6. Copia **"Connection string"** → **"URI"**
7. Debería verse: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

---

### Opción 3: Railway (Auto-configurado)

Si ya despliegas en Railway, la DB se crea automáticamente:
1. Ve a tu proyecto en Railway
2. Agrega servicio **"PostgreSQL"**
3. Click en el servicio PostgreSQL
4. Ve a **"Variables"** tab
5. Copia `DATABASE_URL`

---

## 📋 Después de Obtener la URL

### En Vercel:

1. Ve a **vercel.com/dashboard**
2. Selecciona tu proyecto `aegis`
3. **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Nombre: `DATABASE_URL`
6. Valor: tu URL completa (la que copiaste arriba)
7. Selecciona: ✅ Production, ✅ Preview, ✅ Development
8. Click **"Save"**
9. **Redeploy** tu proyecto (automático o manual)

### En tu archivo .env (desarrollo local):

Crea archivo `.env` en la raíz del proyecto:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

---

## ✅ Verificar que Funciona

Después de configurar:

1. Abre tu app en Vercel
2. Abre **Console del navegador** (F12)
3. Ve a `/leaderboard`
4. Deberías ver los **6 agentes** con datos
5. Si ves "No data available", la DB no está configurada

---

## 🆘 Troubleshooting

**Error: "DATABASE_URL must be set"**
- Verifica que agregaste la variable en Vercel
- Asegúrate que incluye `?sslmode=require`
- Haz redeploy después de agregar variables

**Error: "Connection timeout"**
- Verifica que la DB es accesible desde internet
- En Neon: verifica que no bloqueaste la IP
- Vercel usa múltiples IPs, whitelist todas o desactiva firewall

**Error: "Database does not exist"**
- La URL está mal formada
- Verifica user, password, host, port, dbname
- Prueba la conexión con un cliente como pgAdmin

**"No data available" en la app**
- DB está vacía (normal la primera vez)
- Espera 2-5 minutos para que el seed corra
- O ejecuta manualmente: el seed corre en el primer request

---

## 💡 Free Tier Limits

**Neon:**
- ✅ 512 MB storage
- ✅ 0.5 GB transfer/month
- ✅ Suficiente para testing/demo

**Supabase:**
- ✅ 500 MB storage
- ✅ 2 GB transfer/month
- ✅ Suficiente para testing/demo

**Railway:**
- ✅ $5 credit/mes gratis
- ✅ Suficiente para varios proyectos

---

**¿Dudas?** Si tienes problemas, revisa los logs en Vercel Dashboard → Deployments → tu deployment → Functions.

