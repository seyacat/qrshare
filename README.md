# QRShare - Compartir Archivos Localmente

Una aplicación de Electron que permite compartir archivos en tu red local mediante códigos QR.

## Características

- Selección de archivos del sistema
- Tabla para gestionar archivos seleccionados
- Servidor web local para compartir archivos
- Generación automática de códigos QR
- URLs accesibles desde cualquier dispositivo en la red local

## Instalación

1. Clona o descarga este proyecto
2. Instala las dependencias:
```bash
npm install
```

## Uso

### Desarrollo
1. Instala las dependencias:
```bash
npm install
```

2. Inicia la aplicación:
```bash
npm start
```

### Ejecutables e Instaladores
Para crear ejecutables e instaladores:

```bash
# Crear todos los ejecutables
npm run dist

# Solo para Windows
npm run dist:win

# Solo para macOS
npm run dist:mac

# Solo para Linux
npm run dist:linux
```

Los archivos generados estarán en la carpeta `dist/`:
- **qrshare-electron-1.0.0-setup.exe** - Instalador para Windows
- **qrshare-electron-1.0.0-portable.exe** - Versión portable para Windows
- **qrshare.exe** - Ejecutable descomprimido (en carpetas win-unpacked/)

### Funcionamiento
1. Ejecuta la aplicación (desde desarrollo o instalador)
2. Haz clic en "Seleccionar Archivo" para elegir un archivo
3. Haz clic en "Compartir" junto al archivo que quieras compartir
4. Se abrirá un modal con el código QR y la URL del archivo
5. Escanea el código QR con otro dispositivo en la misma red local
6. El archivo se descargará automáticamente

### URLs Optimizadas
Las URLs son mínimas para códigos QR más legibles:
- Formato: `http://[IP]:[puerto]/[ID]`
- ID: 3 caracteres (letras/números)
- Ejemplo: `http://192.168.1.100:50001/abc`

## Estructura del Proyecto

```
qrshare-electron/
├── main.js          # Proceso principal de Electron
├── preload.js       # Script de preload para comunicación segura
├── index.html       # Interfaz de usuario principal
├── styles.css       # Estilos de la aplicación
├── renderer.js      # Lógica del proceso de renderizado
├── package.json     # Configuración del proyecto
└── README.md        # Este archivo
```

## Funcionamiento Técnico

- **Servidor Web**: Express.js sirve archivos en el puerto 3000 (o el siguiente disponible)
- **Comunicación**: IPC seguro entre procesos principal y de renderizado
- **Códigos QR**: Generados en tiempo real usando QRCode.js
- **Red Local**: Detecta automáticamente la IP local para URLs accesibles

## Requisitos

- Node.js 16 o superior
- NPM o Yarn
- Sistema operativo Windows, macOS o Linux

## Notas

- Los archivos se comparten temporalmente mientras la aplicación esté ejecutándose
- El servidor se detiene automáticamente cuando no hay archivos para compartir
- La aplicación debe estar en ejecución para que los archivos estén disponibles