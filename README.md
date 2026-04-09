# QRShare - P2P File Transfer con WebRTC

**Comparte archivos P2P en tu red local sin necesidad de servidor.**

🌐 **[Abre la app aquí](https://seyacat.github.io/qrshare)** ← Dale click para usar directamente en el navegador

---

## ¿Qué es?

Una **app web pura** (HTML + CSS + JavaScript) para compartir archivos entre dispositivos usando **WebRTC** (P2P directo).

- 📱 Funciona en cualquier navegador moderno
- 🔒 Los archivos viajan P2P, no pasan por servidor
- 📡 Solo la señalización usa WebSocket (offsets, no datos)
- ⚡ Transferencia rápida dentro de la red local
- 📲 QR dinámico para compartir fácilmente

---

## Cómo usar

### Opción 1: Usar online (recomendado)
1. Abre [QRShare en tu navegador](https://seyacat.github.io/qrshare)
2. Selecciona un archivo
3. Comparte el QR o URL con otro dispositivo
4. ¡Listo! La transferencia es P2P directo

### Opción 2: Ejecutar localmente
```bash
cd web/
python3 server.py 8080
```
Luego abre `http://localhost:8080`

---

## Flujo

```
1. Sender abre la app → obtiene token "ABCD"
2. Selecciona archivo → genera QR con URL ?peer=ABCD
3. Receiver escanea QR → abre URL con parámetro
4. Ambos intercambian SDP/ICE vía WebSocket (wss://closer.click:4000)
5. WebRTC Data Channel abre → transferencia P2P en chunks
6. Auto-descarga al completar
```

---

## Características

✅ **P2P directo** - archivos NO pasan por servidor  
✅ **Responsive** - funciona en PC y móvil  
✅ **QR dinámico** - URL generada en tiempo real  
✅ **Barra de progreso** - transferencia en vivo  
✅ **Auto-descarga** - comienza automáticamente  
✅ **Sin límite de tamaño** - soporta archivos grandes  
✅ **Backpressure handling** - optimizado para memoria  

---

## Requisitos

- Navegador moderno con soporte WebRTC (Chrome, Firefox, Safari, Edge)
- Conexión a internet (para acceder a wss://closer.click:4000)
- Mismo WiFi (recomendado) o cualquier red

---

## Estructura del proyecto

```
qrshare/
├── web/                           # ← La app web
│   ├── index.html                 # HTML minimal
│   ├── app.js                     # Lógica (17KB)
│   ├── styles.css                 # Diseño responsive
│   ├── server.py                  # Servidor local
│   └── README.md                  # Docs de la app
├── .github/workflows/
│   └── deploy-pages.yml           # Auto-deploy a GitHub Pages
├── README.md                       # Este archivo
└── package.json
```

---

## Desarrollo local

### Instalar
```bash
# No hay dependencias npm para la app web
# Solo Python para el servidor local

cd web/
python3 server.py 8080
```

Abre `http://localhost:8080`

### Cambiar servidor de señalización
Edita `web/app.js` línea 2:
```js
this.wsUrl = 'wss://tu-servidor:puerto';
```

### Cambiar tamaño de chunk
En `web/app.js`, método `startSendingFile()`:
```js
const CHUNK_SIZE = 128 * 1024; // 128KB en lugar de 64KB
```

---

## Servidor de señalización

Usa `wss://closer.click:4000` - un WebSocket proxy que:
- Asigna tokens únicos a cada conexión
- **Relaya SOLO metadatos** (SDP, ICE)
- **NO transfiere datos** de archivos
- Abre después de 20 min de inactividad

---

## GitHub Pages (Auto-deploy)

Cada vez que haces push a `main` en la carpeta `web/`, se deploya automáticamente a:
```
https://seyacat.github.io/qrshare
```

Ver `.github/workflows/deploy-pages.yml`

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| "No aparece archivo en selector" | Recarga la página (F5) |
| "No se conecta al WebSocket" | Verifica que `wss://closer.click:4000` esté disponible (F12 → Console) |
| "QR no aparece" | Verifica CDN de qr-code-styling o usa fallback a URL texto |
| "Transferencia lenta" | Normal en 4G/5G. El bottleneck es el ancho de banda del móvil |
| "No descarga automáticamente" | Click manual en botón "Descargar Archivo" |

---

## Notas técnicas

- **Chunking**: 64KB por defecto
- **ICE Servers**: Vacío (solo LAN). En producción, agregar STUN/TURN
- **Timeout**: 20 min de inactividad → reconexión necesaria
- **Max conexiones**: Sin límite (depende del servidor proxy)

---

## Licencia

MIT

---

**¿Preguntas?** Abre un issue o revisa `web/README.md` para más detalles técnicos.
