# 🔄 Modo de Cuenta Compartida para Desarrollo

## ⚠️ Advertencia

Usar una sola cuenta de AsterDex para todos los agentes **NO es recomendado para producción** porque:
- ❌ No hay aislamiento real de fondos
- ❌ Los agentes pueden interferir entre sí
- ❌ Pérdidas de un agente afectan a todos
- ❌ No es una competencia justa

**PERO** es útil para:
- ✅ Desarrollo y testing local
- ✅ Demos sin fondos reales
- ✅ Entender cómo funciona el sistema

---

## 🛠️ Configuración Simplificada

### Opción 1: Una sola cuenta para TODOS los agentes

Edita las variables de entorno en Vercel:

```bash
# Solo necesitas 1 API key y 1 secret
AGENT_DEEPSEEK_API_KEY=mi_unica_asterdex_key
AGENT_DEEPSEEK_API_SECRET=mi_unico_secret

# Usa las mismas credenciales para TODOS los agentes
AGENT_GPT5_API_KEY=mi_unica_asterdex_key
AGENT_GPT5_API_SECRET=mi_unico_secret
AGENT_CLAUDE35_API_KEY=mi_unica_asterdex_key
AGENT_CLAUDE35_API_SECRET=mi_unico_secret
AGENT_GROK4_API_KEY=mi_unica_asterdex_key
AGENT_GROK4_API_SECRET=mi_unico_secret
AGENT_LLAMA31_API_KEY=mi_unica_asterdex_key
AGENT_LLAMA31_API_SECRET=mi_unico_secret
AGENT_GEMINI2_API_KEY=mi_unica_asterdex_key
AGENT_GEMINI2_API_SECRET=mi_unico_secret
```

**Resultado:** Todos los agentes usarán la misma cuenta de AsterDex pero mantendrán trackings separados en la base de datos.

---

## 🎯 ¿Qué Pasa en este Modo?

### En el Backend:
- Cada agente crea un cliente AsterDex con las mismas credenciales
- Cada agente hace decisiones independientes (gracias a las LLMs)
- Los trades se ejecutan en la MISMA cuenta de AsterDex
- La DB trackea qué agent hizo cada trade

### En el Frontend:
- El leaderboard mostrará PnL separado **basado en tracking de DB**
- Pero los fondos reales estarán **compartidos en una sola cuenta**
- Los agentes pueden "gastarse" entre sí

---

## 📊 Tracking vs Realidad

| Métrica | Lo que Verás | Realidad |
|---------|-------------|----------|
| PnL por agente | Separado en cada carta | Compartido en AsterDex |
| Win rate | Individual calculado | Basado en DB |
| Capital actual | $600 cada uno = $3600 total | Solo 1 cuenta con ~$600 |
| Trades ejecutados | 6 agentes diferentes | 1 cuenta haciendo todo |

**TL;DR**: Los agentes se ven como competidores pero en realidad usan la misma billetera. 🎭

---

## 🧪 Recomendación para Testing

### Para Desarrollo Local:
```bash
# .env local
AGENT_DEEPSEEK_API_KEY=test_key
AGENT_DEEPSEEK_API_SECRET=test_secret
# ... repetir para todos los agentes

DATABASE_URL=postgresql://...tu_local_db
NODE_ENV=development
```

### Para Vercel Demo:
```bash
# Usa una cuenta de test de AsterDex
# NO uses fondos reales
# Ideal: < $100 para testing
```

---

## 🚀 Alternativa: Modo Simulación (Sin AsterDex)

Si quieres evitar usar AsterDex completamente para desarrollo:

1. **Comenta el trading engine en `server/index.ts`**:
```typescript
// tradingEngine.start(); // <-- comentar esto
```

2. **Usa datos simulados**:
- Los agentes aún analizarán el mercado
- Pero no ejecutarán trades reales
- El leaderboard mostrará datos de prueba

---

## ✅ Checklist de Seguridad

Antes de usar cuenta compartida:

- [ ] Usa fondos mínimos (<$100)
- [ ] Usa testnet si está disponible
- [ ] Monitora los trades en tiempo real
- [ ] Ten un botón de emergencia para parar
- [ ] NO uses esto para producción

---

## 🔐 Configuración Recomendada para Producción

**Para una competencia REAL**, necesitas:

1. **6 cuentas separadas en AsterDex** (una por agente)
2. **1 BNB por cuenta** (~$600 cada una)
3. **Credenciales únicas** por cada agente
4. **Monitoreo** de cada cuenta
5. **Aislamiento total** entre agentes

Esto cuesta ~$3,600 en capital inicial pero garantiza una competencia justa.

---

## 💡 Resumen

| Escenario | Cuentas AsterDex | Costo | Aislamiento |
|-----------|------------------|-------|-------------|
| **Demo/Test** | 1 compartida | ~$100 | ❌ |
| **Competencia** | 6 separadas | ~$3,600 | ✅ |
| **Simulación** | 0 (fake) | $0 | ❌ |

**Para tu deploy inicial en Vercel**, usa **1 cuenta compartida** para testing. 
Si funciona bien y quieres una competencia real, luego separa las cuentas.
