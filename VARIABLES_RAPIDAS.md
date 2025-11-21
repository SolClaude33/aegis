# ⚡ Variables de Entorno - Lista Rápida

## 🚨 OBLIGATORIA (Solo 1)

```
DATABASE_URL=postgresql://user:pass@host.neon.tech:5432/main?sslmode=require
```
**Sin esto, la app NO funcionará** ❌

Cómo obtenerla → [GET_DATABASE_URL.md](./GET_DATABASE_URL.md)

---

## 🎯 RECOMENDADAS (Para que los agentes funcionen)

### Mínimas (2 agentes):
```
LLM_GPT5_API_KEY=sk-tu_key
LLM_CLAUDE35_API_KEY=sk-ant-tu_key
```

### Ideales (todos los agentes):
```
LLM_DEEPSEEK_API_KEY=sk-tu_key
LLM_GPT5_API_KEY=sk-tu_key
LLM_CLAUDE35_API_KEY=sk-ant-tu_key
LLM_GROK4_API_KEY=tu_key
LLM_LLAMA31_API_KEY=tu_key
LLM_GEMINI2_API_KEY=tu_key
```

**Donde obtenerlas:**
- DeepSeek: https://platform.deepseek.com/
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- xAI: https://console.x.ai/
- Alibaba: https://dashscope.console.aliyun.com/
- Google: https://aistudio.google.com/app/apikey

---

## 🎰 AsterDex (Opcional)

### Para Trading Real:
```
AGENT_DEEPSEEK_API_KEY=tu_key
AGENT_DEEPSEEK_API_SECRET=tu_secret
# ... repetir para cada agente O usar las mismas para todos
```

**Sin estas → funciona en modo SIMULACIÓN**

### Para Datos de Mercado (Opcional):
```bash
ALPHA_VANTAGE_API_KEY=tu_api_key
```
**Obtener API key:** https://www.alphavantage.co/support/#api-key (gratuita)

Sin esta variable → Usa CryptoCompare API (básica, sin API key)
Con esta variable → Usa Alpha Vantage para:
- Indicadores técnicos avanzados (RSI, MACD, Bollinger Bands, ADX, Stochastic)
- Análisis de sentimiento de mercado basado en noticias (News & Sentiments)

### Sistema:
```
NODE_ENV=production
```

---

## 📋 Resumen por Prioridad

### ✅ Mínimo para que funcione:
1. `DATABASE_URL` ⭐
2. `LLM_GPT5_API_KEY`
3. `LLM_CLAUDE35_API_KEY`

### ✅ Recomendado:
+ `LLM_DEEPSEEK_API_KEY`
+ `LLM_GROK4_API_KEY`
+ `LLM_LLAMA31_API_KEY`
+ `LLM_GEMINI2_API_KEY`

### ⚙️ Opcional:
+ AsterDex keys (para trading real)
+ `NODE_ENV`

---

## 🎯 Setup Rápido para Vercel

Copiar y pegar esto en **Vercel → Environment Variables**:

```bash
DATABASE_URL=postgresql://user:pass@host.neon.tech:5432/main?sslmode=require
LLM_DEEPSEEK_API_KEY=sk-tu_key
LLM_GPT5_API_KEY=sk-tu_key
LLM_CLAUDE35_API_KEY=sk-ant-tu_key
LLM_GROK4_API_KEY=tu_key
LLM_LLAMA31_API_KEY=tu_key
LLM_GEMINI2_API_KEY=tu_key
```

**Después de agregar, hacer Redeploy** 🔄

---

**Ver lista completa:** [ENV_SETUP.md](./ENV_SETUP.md)

