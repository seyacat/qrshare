# QRShare Web - P2P File Transfer con WebRTC

App web pura (HTML + CSS + JavaScript) para compartir archivos P2P usando WebRTC y un proxy WebSocket.

## Cómo usar

### 1. Servir la carpeta web

```bash
# Opción 1: Python
cd /home/seyacat/qrshare/web
python3 -m http.server 8080

# Opción 2: Node.js
npx http-server

# Opción 3: Live server (VS Code extension)
```

### 2. Acceder a la app

- **Sender (PC)**: `http://localhost:8080`
- **Receiver (móvil)**: Escanea el QR generado

## Arquitectura

### Flujo
1. Sender conecta → obtiene token "ABCD"
2. Sender selecciona archivo → genera QR con URL `?peer=ABCD`
3. Receiver escanea QR → abre URL con `?peer=ABCD`
4. Receiver conecta → obtiene token "EFGH"
5. Intercambio de SDP/ICE via WebSocket (wss://closer.click:4001)
6. WebRTC Data Channel abre → transferencia P2P en chunks de 64KB
7. Auto-descarga al completar

### Componentes

| Archivo | Descripción |
|---------|-------------|
| `index.html` | HTML mínimo + CDN scripts |
| `styles.css` | Estilos para sender y receiver |
| `app.js` | Lógica completa (WebSocket, WebRTC, UI) |

## Características

✅ P2P directo - archivos no pasan por servidor  
✅ Interfaz responsive (PC y móvil)  
✅ QR generado dinámicamente  
✅ Barra de progreso en tiempo real  
✅ Auto-descarga al completar  
✅ Soporte para archivos de cualquier tamaño  
✅ Backpressure handling para evitar desbordamiento  

## Servidor de señalización

Usa `wss://closer.click:4001` - WebSocket proxy que:
- Asigna tokens de 4 caracteres a cada cliente
- Relaya mensajes entre peers
- **No** transfiere datos de archivos (solo señalización)

Protocolo simple:
```js
// Conectar
{ type: "connected", token: "ABCD" }

// Enviar mensaje a otro peer
{ to: ["TOKEN"], message: "JSON stringified" }

// Recibir
{ type: "message", from: "TOKEN", message: "..." }
```

## Requisitos

- Navegador moderno con soporte WebRTC
- Conexión a internet (para acceder a wss://closer.click:4001)
- Misma red local (recomendado) o cualquier red (ambos dispositivos pueden estar en redes diferentes)

## Troubleshooting

### "No se conecta al servidor WebSocket"
- Verificar que `wss://closer.click:4001` esté disponible
- Revisar console del navegador (F12)

### "No aparece el QR"
- Verificar que qr-code-styling CDN esté disponible
- Fallback a texto de URL

### "Transferencia lenta"
- Es normal en redes 4G/5G
- El bottleneck es la conexión del móvil, no WebRTC

### "No descarga el archivo"
- Verificar que el navegador permite descargas automáticas
- Intentar descargar manualmente con el botón

## Notas técnicas

- **Chunking**: 64KB por chunk, puede aumentarse pero afecta memoria
- **Ice Servers**: Vacío - solo LAN. En producción, agregar STUN/TURN
- **Signaling server**: Solo mantiene metadatos, no archivos
- **Timeout**: Si no hay actividad, el servidor cierra la conexión (20min de inactividad)

## Desarrollo

Para cambiar el servidor de señalización:
```js
// En app.js línea 1
this.wsUrl = 'wss://tu-servidor:puerto';
```

Para cambiar tamaño de chunk:
```js
// En app.js método startSendingFile()
const CHUNK_SIZE = 128 * 1024; // 128KB
```
