# QRShare Web - P2P File Transfer con WebRTC

App web pura (HTML + CSS + JavaScript) para compartir archivos P2P usando WebRTC y el proxy WebSocket de Closer Click.

## Cómo usar

### 1. Servir la carpeta web

Cualquier servidor estático sirve. Por ejemplo:

```bash
npx http-server .
```

### 2. Acceder a la app

- **Sender (PC)**: `http://localhost:8080`
- **Receiver (móvil)**: Escanea el QR generado

## Arquitectura

### Flujo

1. Sender conecta → obtiene token (4 chars, ej. "ABCD")
2. Sender selecciona archivo → genera QR con URL `?peer=ABCD`
3. Receiver escanea QR → abre URL con `?peer=ABCD`
4. Receiver conecta → obtiene su propio token
5. Intercambio de SDP/ICE vía WebSocket (`wss://proxy.closer.click`)
6. WebRTC Data Channel abre → transferencia P2P en chunks de 64 KB
7. Auto-descarga al completar

### Componentes

| Archivo | Descripción |
|---------|-------------|
| `index.html` | HTML mínimo + CDN scripts |
| `styles.css` | Estilos para sender y receiver |
| `app.js` | Lógica completa (WebSocket, WebRTC, UI) |

## Características

- P2P directo - los archivos no pasan por el servidor
- Interfaz responsive (PC y móvil)
- QR generado dinámicamente
- Barra de progreso en tiempo real
- Auto-descarga al completar
- Soporte para archivos de cualquier tamaño
- Backpressure handling para evitar desbordamiento

## Servidor de señalización

Usa `wss://proxy.closer.click` — proxy WebSocket que:

- Asigna tokens cortos (4 caracteres) a cada cliente
- Relaya mensajes entre tokens
- **No** transfiere datos de archivos (solo señalización SDP/ICE)

Protocolo:

```js
// Recibido al conectar
{ type: "connected", token: "ABCD" }

// Enviar mensaje a otro peer
{ to: ["TOKEN"], message: "<JSON stringified>" }

// Recibir mensaje de otro peer
{ type: "message", from: "TOKEN", message: "..." }
```

## Requisitos

- Navegador moderno con soporte WebRTC
- Acceso a `wss://proxy.closer.click`

## Troubleshooting

### "No se conecta al servidor WebSocket"
- Verificar que `wss://proxy.closer.click` esté disponible
- Revisar consola del navegador (F12)

### "No aparece el QR"
- Verificar que el CDN de qr-code-styling esté disponible
- Fallback a texto de URL

### "Transferencia lenta"
- Es normal en redes 4G/5G
- El bottleneck es la conexión del móvil, no WebRTC

### "No descarga el archivo"
- Verificar que el navegador permite descargas automáticas
- Intentar descargar manualmente con el botón

## Notas técnicas

- **Chunking**: 64 KB por chunk
- **ICE Servers**: Vacío - solo LAN. En producción, agregar STUN/TURN
- **Servidor de señalización**: Solo metadatos, no archivos

## Desarrollo

Para cambiar el servidor de señalización, edita `app.js` línea 3:

```js
this.wsUrl = 'wss://tu-servidor';
```

Para cambiar tamaño de chunk, en `startSendingFile()`:

```js
const CHUNK_SIZE = 128 * 1024; // 128 KB
```
