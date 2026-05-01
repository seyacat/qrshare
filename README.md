# QRShare - P2P File Transfer con WebRTC

**Comparte archivos P2P entre dispositivos usando WebRTC.**

🌐 **[Abre la app aquí](https://seyacat.github.io/qrshare)** ← úsala directamente en el navegador

---

## ¿Qué es?

Una **app web pura** (HTML + CSS + JavaScript) para compartir archivos entre dispositivos usando **WebRTC** (P2P directo).

- Funciona en cualquier navegador moderno
- Los archivos viajan P2P, no pasan por el servidor
- Solo la señalización (SDP/ICE) usa el proxy WebSocket
- Transferencia rápida en red local
- QR dinámico para emparejar fácil

---

## Cómo usar

### Online (recomendado)
1. Abre [QRShare en tu navegador](https://seyacat.github.io/qrshare)
2. Selecciona un archivo
3. Comparte el QR o URL con otro dispositivo
4. La transferencia es P2P directa

### Local
Sirve la carpeta `web/` con cualquier servidor estático (por ejemplo `npx http-server`) y abre `http://localhost:8080`.

---

## Flujo

```
1. Sender abre la app → obtiene token "ABCD"
2. Selecciona archivo → genera QR con URL ?peer=ABCD
3. Receiver escanea QR → abre URL con parámetro
4. Ambos intercambian SDP/ICE vía WebSocket (wss://proxy.closer.click)
5. WebRTC Data Channel abre → transferencia P2P en chunks
6. Auto-descarga al completar
```

---

## Características

- P2P directo: archivos NO pasan por el servidor
- Responsive: PC y móvil
- QR dinámico generado en tiempo real
- Barra de progreso en vivo
- Auto-descarga al completar
- Sin límite de tamaño
- Backpressure handling

---

## Requisitos

- Navegador moderno con soporte WebRTC (Chrome, Firefox, Safari, Edge)
- Acceso a `wss://proxy.closer.click`

---

## Estructura del proyecto

```
qrshare/
├── web/                           ← La app web
│   ├── index.html                 # HTML mínimo
│   ├── app.js                     # Lógica (WebSocket + WebRTC + UI)
│   ├── styles.css                 # Diseño responsive
│   └── README.md                  # Docs de la app
├── .github/workflows/
│   └── deploy-pages.yml           # Auto-deploy a GitHub Pages
├── README.md                       # Este archivo
└── package.json
```

---

## Desarrollo

### Cambiar servidor de señalización
Edita `web/app.js` línea 3:
```js
this.wsUrl = 'wss://tu-servidor';
```

### Cambiar tamaño de chunk
En `web/app.js`, método `startSendingFile()`:
```js
const CHUNK_SIZE = 128 * 1024; // 128 KB en lugar de 64 KB
```

---

## Servidor de señalización

Usa `wss://proxy.closer.click` — un WebSocket proxy que:

- Asigna tokens cortos (4 caracteres) a cada conexión
- Relaya **solo** metadatos (SDP, ICE)
- **No** transfiere datos de archivos
- Sin estado persistente

---

## GitHub Pages

Cada push a `main` que toque `web/` se publica automáticamente en:
```
https://seyacat.github.io/qrshare
```

Ver `.github/workflows/deploy-pages.yml`.

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| No aparece el archivo en el selector | Recarga la página (F5) |
| No se conecta al WebSocket | Verifica que `wss://proxy.closer.click` esté disponible (F12 → Console) |
| QR no aparece | Verifica el CDN de qr-code-styling o usa el fallback de URL en texto |
| Transferencia lenta | Normal en 4G/5G. El cuello de botella es el ancho de banda del móvil |
| No descarga automáticamente | Click manual en "Descargar Archivo" |

---

## Notas técnicas

- **Chunking**: 64 KB por defecto
- **ICE Servers**: vacío (solo LAN). En producción, agregar STUN/TURN
- **Max conexiones**: depende del proxy

---

## Licencia

MIT
