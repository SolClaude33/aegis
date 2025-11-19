# Trading Control API - Configuración Segura

## 🔐 Configuración en Railway

Los endpoints de control de trading están protegidos con una API key secreta. Solo tú puedes controlar el trading.

### 1. Agregar Variable de Entorno en Railway

1. Ve a tu proyecto en Railway
2. Abre la pestaña **Variables**
3. Agrega una nueva variable:
   - **Nombre:** `TRADING_CONTROL_API_KEY`
   - **Valor:** Genera una clave secreta segura (ej: `tu-clave-super-secreta-1234` o usa un generador de UUID)

### 2. Reiniciar el Servicio

Después de agregar la variable, Railway reiniciará automáticamente el servicio.

## 📡 Uso de la API

### Método 1: Header (Recomendado)

```bash
# Ver estado
curl -H "X-Trading-API-Key: tu-clave-secreta" \
  https://tu-dominio.railway.app/api/trading/status

# Iniciar trading
curl -X POST \
  -H "X-Trading-API-Key: tu-clave-secreta" \
  https://tu-dominio.railway.app/api/trading/resume

# Pausar trading (sin cerrar posiciones)
curl -X POST \
  -H "X-Trading-API-Key: tu-clave-secreta" \
  -H "Content-Type: application/json" \
  -d '{"closePositions": false}' \
  https://tu-dominio.railway.app/api/trading/pause

# Pausar trading Y cerrar todas las posiciones
curl -X POST \
  -H "X-Trading-API-Key: tu-clave-secreta" \
  -H "Content-Type: application/json" \
  -d '{"closePositions": true}' \
  https://tu-dominio.railway.app/api/trading/pause

# Solo cerrar posiciones (sin pausar)
curl -X POST \
  -H "X-Trading-API-Key: tu-clave-secreta" \
  https://tu-dominio.railway.app/api/trading/close-all-positions
```

### Método 2: Query Parameter

```bash
# Ver estado
curl https://tu-dominio.railway.app/api/trading/status?apiKey=tu-clave-secreta

# Iniciar trading
curl -X POST \
  https://tu-dominio.railway.app/api/trading/resume?apiKey=tu-clave-secreta
```

⚠️ **Nota:** El método de query parameter es menos seguro porque la clave puede aparecer en logs. Usa el header cuando sea posible.

## 🔒 Seguridad

- ✅ Solo tú tienes acceso a la API key (está en Railway como variable de entorno)
- ✅ Sin la API key, nadie puede controlar el trading
- ✅ Los endpoints responden con `401 Unauthorized` si la clave es incorrecta
- ✅ La clave nunca se expone en el frontend o código público

## 📋 Endpoints Disponibles

### `GET /api/trading/status`
Obtiene el estado actual del trading engine.

**Respuesta:**
```json
{
  "isRunning": true,
  "isPaused": true,
  "isTrading": false
}
```

### `POST /api/trading/resume`
Inicia/reanuda el trading.

**Respuesta:**
```json
{
  "success": true,
  "message": "Trading resumed"
}
```

### `POST /api/trading/pause`
Pausa el trading.

**Body (opcional):**
```json
{
  "closePositions": true  // Cierra todas las posiciones abiertas si es true
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Trading paused and all positions closed"
}
```

### `POST /api/trading/close-all-positions`
Cierra todas las posiciones abiertas sin pausar el trading.

**Respuesta:**
```json
{
  "success": true,
  "closed": 5,
  "errors": 0,
  "message": "Closed 5 positions, 0 errors"
}
```

## ⚠️ Errores Comunes

### Error 500: "Trading control authentication not configured"
- **Causa:** No has agregado `TRADING_CONTROL_API_KEY` en Railway
- **Solución:** Agrega la variable de entorno en Railway y reinicia

### Error 401: "Unauthorized - Invalid API key"
- **Causa:** La API key proporcionada no coincide
- **Solución:** Verifica que estés usando la misma clave que configuraste en Railway

