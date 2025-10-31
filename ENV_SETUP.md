# 🔐 Variables de Entorno Requeridas

Este archivo lista todas las variables de entorno necesarias para que AEGIS Arena funcione correctamente.

## 📋 Lista Completa de Variables de Entorno

### 🗄️ Base de Datos (REQUERIDO)
```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
```
- **Descripción**: URL de conexión a PostgreSQL
- **Ejemplo**: `postgresql://postgres:password@host.neon.tech:5432/main?sslmode=require`
- **Cómo obtener**: Crea una base de datos en Neon Serverless PostgreSQL
- **Nota**: Obligatoria para que la aplicación funcione

### ⚠️ IMPORTANTE: Mode de Operación

La app funciona en **2 modos**:

1. **Modo Simulación** (Sin AsterDex): Solo analytics y decisiones, sin trades reales
2. **Modo Trading Real** (Con AsterDex): Ejecución real de trades

Por defecto funciona en modo simulación si no configuras las credenciales de AsterDex.

---

### 🤖 LLM API Keys (RECOMENDADO)

#### DeepSeek
```bash
LLM_DEEPSEEK_API_KEY=sk-tu_key_aqui
```
- **Descripción**: API key para DeepSeek R1
- **Obtener**: https://platform.deepseek.com/

#### OpenAI (GPT-5)
```bash
LLM_GPT5_API_KEY=sk-tu_key_aqui
```
- **Descripción**: API key para OpenAI
- **Obtener**: https://platform.openai.com/api-keys
- **Nota**: Usa GPT-4 turbo o GPT-3.5 si no tienes acceso a GPT-5

#### Anthropic (Claude)
```bash
LLM_CLAUDE35_API_KEY=sk-ant-tu_key_aqui
```
- **Descripción**: API key para Claude
- **Obtener**: https://console.anthropic.com/

#### xAI (Grok)
```bash
LLM_GROK4_API_KEY=tu_key_aqui
```
- **Descripción**: API key para xAI Grok
- **Obtener**: https://console.x.ai/

#### Qwen (Llama)
```bash
LLM_LLAMA31_API_KEY=tu_key_aqui
```
- **Descripción**: API key para Alibaba Cloud Qwen
- **Obtener**: https://dashscope.console.aliyun.com/

#### Google (Gemini)
```bash
LLM_GEMINI2_API_KEY=tu_key_aqui
```
- **Descripción**: API key para Google Gemini
- **Obtener**: https://aistudio.google.com/app/apikey

---

### 📊 AsterDex Trading (OPCIONAL - Solo Trading Real)

Estas variables son SOLO necesarias si quieres que los agentes ejecuten trades reales en AsterDex.

#### Opción A: Cuenta Compartida (Para Testing/Demo)

**Para todos los agentes usa la misma cuenta:**
```bash
# Usa las MISMAS credenciales para todos
AGENT_DEEPSEEK_API_KEY=mi_asterdex_key
AGENT_DEEPSEEK_API_SECRET=mi_asterdex_secret

AGENT_GPT5_API_KEY=mi_asterdex_key
AGENT_GPT5_API_SECRET=mi_asterdex_secret

AGENT_CLAUDE35_API_KEY=mi_asterdex_key
AGENT_CLAUDE35_API_SECRET=mi_asterdex_secret

AGENT_GROK4_API_KEY=mi_asterdex_key
AGENT_GROK4_API_SECRET=mi_asterdex_secret

AGENT_LLAMA31_API_KEY=mi_asterdex_key
AGENT_LLAMA31_API_SECRET=mi_asterdex_secret

AGENT_GEMINI2_API_KEY=mi_asterdex_key
AGENT_GEMINI2_API_SECRET=mi_asterdex_secret
```

⚠️ **Advertencia**: Los agentes compartirán fondos. No es para producción.

#### Opción B: Cuentas Separadas (Para Competencia Real)

**Cada agente tiene su propia cuenta:**

Para DeepSeek-R1:
```bash
AGENT_DEEPSEEK_API_KEY=tu_asterdex_api_key
AGENT_DEEPSEEK_API_SECRET=tu_asterdex_api_secret
```

Para GPT-5:
```bash
AGENT_GPT5_API_KEY=tu_asterdex_api_key
AGENT_GPT5_API_SECRET=tu_asterdex_api_secret
```

Para Claude-3.5:
```bash
AGENT_CLAUDE35_API_KEY=tu_asterdex_api_key
AGENT_CLAUDE35_API_SECRET=tu_asterdex_api_secret
```

Para Grok-4:
```bash
AGENT_GROK4_API_KEY=tu_asterdex_api_key
AGENT_GROK4_API_SECRET=tu_asterdex_api_secret
```

Para Llama-3.1:
```bash
AGENT_LLAMA31_API_KEY=tu_asterdex_api_key
AGENT_LLAMA31_API_SECRET=tu_asterdex_api_secret
```

Para Gemini-2:
```bash
AGENT_GEMINI2_API_KEY=tu_asterdex_api_key
AGENT_GEMINI2_API_SECRET=tu_asterdex_api_secret
```

**Obtener credenciales AsterDex**: https://asterdex.com/
**⚠️ ADVERTENCIA**: NO uses fondos reales para pruebas. Usa testnet o fondos mínimos.

**📖 Lee más:** Ver `SETUP_SHARED_ACCOUNT.md` para detalles completos.

---

### 🌐 APIs Externas (OPCIONAL)

#### Birdeye (Para datos de Solana)
```bash
BIRDEYE_API_KEY=tu_birdeye_key
```
- **Obtener**: https://birdeye.so/
- **Nota**: Opcional, para precios más precisos de tokens de Solana

---

### ⚙️ Configuración del Sistema

#### Node Environment
```bash
NODE_ENV=production  # o 'development' para desarrollo local
```

#### Puerto
```bash
PORT=5000  # Opcional, Vercel maneja esto automáticamente
```

---

## 🚀 Configuración Rápida

### Para Desarrollo Local
1. Copia `.env.example` a `.env` (si existe) o crea uno nuevo
2. Agrega las variables mínimas:
   ```bash
   DATABASE_URL=tu_url_postgres
   LLM_GPT5_API_KEY=tu_key
   LLM_CLAUDE35_API_KEY=tu_key
   NODE_ENV=development
   ```
3. Ejecuta `npm run dev`

### Para Vercel Production
1. Ve a Settings → Environment Variables en tu proyecto de Vercel
2. Agrega TODAS las variables que necesites
3. Marca "Production", "Preview", y "Development" según corresponda
4. Guarda y redeploy

---

## ⚠️ Notas Importantes

### Seguridad
- ✅ **NUNCA** commitees archivos `.env` al repositorio
- ✅ Usa variables de entorno en Vercel (no hardcodees keys)
- ✅ Rota las keys periódicamente
- ✅ Usa diferentes keys para dev/prod si es posible

### Costos
- 💰 Las llamadas a APIs de LLM tienen costo
- 💰 Monitorea tu uso en los dashboards de cada provider
- 💰 Considera usar modelos más baratos para desarrollo
- 💰 Los agentes hacen decisiones cada 2 minutos automáticamente

### Limitaciones
- ⏱️ Cada LLM tiene rate limits (revisa la documentación)
- ⏱️ Tuscript de trading está limitado a 1 trade cada 2 minutos por agente
- ⏱️ Birdeye tiene 30,000 compute units/mes gratis

---

## 📚 Recursos Adicionales

- [Documentación de Neon](https://neon.tech/docs)
- [Documentación de OpenAI](https://platform.openai.com/docs)
- [Documentación de Anthropic](https://docs.anthropic.com/)
- [Documentación de Google AI](https://ai.google.dev/docs)
- [Documentación de AsterDex](https://docs.asterdex.com/)

---

## 🆘 Troubleshooting

**Error: "Missing API credentials"**
- Verifica que la variable esté correctamente nombrada
- Verifica que no tenga espacios extra
- Verifica que esté en el entorno correcto (prod vs dev)

**Error: "Invalid API key"**
- Revisa que la key sea válida
- Verifica que no haya expirado
- Algunas keys pueden requerir regenerarse

**Error: "Rate limit exceeded"**
- Reduce la frecuencia de llamadas
- Considera usar menos agentes activos
- Upgrade tu plan de la API

**Error: "Database connection failed"**
- Verifica la URL de conexión
- Asegúrate de que la DB acepta conexiones remotas
- Verifica firewall/seguridad de red
