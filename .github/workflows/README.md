# GitHub Actions Workflows

## deploy-pages.yml

Automatiza el despliegue de la carpeta `web/` a GitHub Pages.

### Configuración requerida

1. **Habilitar GitHub Pages en tu repositorio:**
   - Ve a Settings → Pages
   - En "Build and deployment"
   - Selecciona "GitHub Actions" como fuente

2. **El workflow se ejecutará automáticamente cuando:**
   - Hagas push a la rama `main`
   - Modifiques archivos en la carpeta `web/`

### Resultado

La app estará disponible en:
```
https://tu-usuario.github.io/qrshare
```

O si está en un repo con nombre diferente:
```
https://tu-usuario.github.io/nombre-repo
```

### Trigger manual

Si quieres desplegar manualmente:
1. Ve a Actions → Deploy to GitHub Pages
2. Click en "Run workflow"

### Variables de entorno

Para cambiar la URL del servidor WebSocket cuando esté en GitHub Pages, modifica en `web/app.js`:

```js
this.wsUrl = 'wss://proxy.closer.click'; // o tu servidor
```

### Monitoreo

- Ve a Actions para ver el estado de los despliegues
- Verás logs completos de cada ejecución
