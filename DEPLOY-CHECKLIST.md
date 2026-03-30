# Checklist de Despliegue

> Lista de verificación para desplegar cmx-memories correctamente.

---

## Fase 1: Preparación del Servidor ⏱️ 10 min

- [ ] **1.1** Acceso SSH al servidor obtenido
- [ ] **1.2** Node.js 18+ instalado en el servidor
      ```bash
      node --version
      ```
- [ ] **1.3** Puerto 3000 abierto en el firewall
      ```bash
      # Ubuntu/Debian
      sudo ufw allow 3000/tcp
      sudo ufw reload
      ```
- [ ] **1.4** Carpeta del proyecto transferida al servidor

---

## Fase 2: Instalación ⏱️ 5 min

- [ ] **2.1** Navegar a la carpeta del proyecto
      ```bash
      cd cmx-memories
      ```
- [ ] **2.2** Instalar dependencias
      ```bash
      npm install
      ```
- [ ] **2.3** Compilar el proyecto
      ```bash
      npm run build
      ```
- [ ] **2.4** Verificar compilación exitosa
      ```bash
      ls dist/
      ```

---

## Fase 3: Configuración ⏱️ 5 min

- [ ] **3.1** Copiar archivo de entorno
      ```bash
      cp .env.example .env
      ```
- [ ] **3.2** Editar `.env` con la configuración deseada

- [ ] **3.2.1** Configurar API Key (OBLIGATORIO en producción)
      ```
      CMX_API_KEY=una-clave-muy-segura-123
      ```

- [ ] **3.2.2** Seleccionar modo de despliegue:
      - [ ] **Modo A**: Sin subpath (más simple)
            ```
            # .env
            CMX_BASE_PATH=
            ```
      - [ ] **Modo B**: Con subpath (recomendado)
            ```
            # .env
            CMX_BASE_PATH=/cmx-memories
            ```

---

## Fase 4: Iniciar Servidor ⏱️ 2 min

- [ ] **4.1** Seleccionar comando de inicio:

      **Modo Local (sin subpath):**
      ```bash
      npm run api:remote
      ```

      **Modo con Subpath:**
      ```bash
      npm run api:subpath:remote
      ```

- [ ] **4.2** Verificar mensaje de inicio exitoso
      ```
      ========================================
        cmx-memories API v1.0.0
      ========================================
      Server running on: http://0.0.0.0:3000
      Base path: /cmx-memories
      ```

---

## Fase 5: Verificación del Servidor ⏱️ 3 min

- [ ] **5.1** Probar health check desde el servidor
      ```bash
      # Con subpath
      curl http://localhost:3000/cmx-memories/health
      
      # Sin subpath
      curl http://localhost:3000/health
      ```

- [ ] **5.2** Probar health check desde tu PC local
      ```bash
      curl http://IP-DEL-SERVIDOR:3000/cmx-memories/health
      ```

- [ ] **5.3** Verificar respuesta JSON
      ```json
      {
        "status": "ok",
        "timestamp": "2026-...",
        "basePath": "/cmx-memories",
        "version": "1.0.0"
      }
      ```

---

## Fase 6: Configurar Cliente (OpenCode) ⏱️ 5 min

- [ ] **6.1** Configurar variables de entorno en tu PC:

      **Linux/Mac:**
      ```bash
      export CMX_MEMORIES_HOST="IP-O-DOMINIO-DEL-SERVIDOR"
      export CMX_MEMORIES_PORT="3000"
      export CMX_MEMORIES_BASE_PATH="/cmx-memories"
      export CMX_API_KEY="una-clave-muy-segura-123"
      ```

      **Windows (PowerShell):**
      ```powershell
      $env:CMX_MEMORIES_HOST="IP-O-DOMINIO-DEL-SERVIDOR"
      $env:CMX_MEMORIES_PORT="3000"
      $env:CMX_MEMORIES_BASE_PATH="/cmx-memories"
      $env:CMX_API_KEY="una-clave-muy-segura-123"
      ```

- [ ] **6.2** Iniciar OpenCode
      ```bash
      opencode
      ```

- [ ] **6.3** Verificar conexión en los logs de OpenCode
      ```
      cmx-memories API running at http://IP:3000/cmx-memories
      ```

---

## Fase 7: Prueba Final ⏱️ 3 min

- [ ] **7.1** Crear una memoria de prueba desde OpenCode
      - Usa el comando `mem_save` con un test

- [ ] **7.2** Buscar la memoria
      - Usa `mem_search` para verificar que se guardó

- [ ] **7.3** Listar memorias
      - Usa `mem_list` para ver todas las memorias

- [ ] **7.4** Verificar persistencia (reinicia el servidor si es necesario)

---

## Comandos Rápidos de Verificación

```bash
# 1. Verificar que el proceso está corriendo
ps aux | grep cmx-memories

# 2. Ver logs del servidor
pm2 logs cmx-memories  # Si usas PM2
# o
tail -f nohup.out      # Si usas nohup

# 3. Reiniciar el servidor
pm2 restart cmx-memories  # Si usas PM2
# o
# Ctrl+C y vuelve a iniciar

# 4. Detener el servidor
pm2 stop cmx-memories  # Si usas PM2
# o
# Ctrl+C
```

---

## Producción (Opcional)

- [ ] **P1** Instalar PM2 para gestión de procesos
      ```bash
      npm install -g pm2
      pm2 start "npm run api:subpath:remote" --name cmx-memories
      pm2 save
      pm2 startup
      ```

- [ ] **P2** Configurar nginx (ver `nginx.example.conf`)

- [ ] **P3** Configurar SSL con Let's Encrypt

- [ ] **P4** Configurar backup automático de la base de datos
      ```bash
      # Crontab para backup diario
      0 2 * * * cd /path/to/cmx-memories && cp memories.db memories.db.backup
      ```

---

## Resolución de Problemas Rápidos

| Problema | Solución |
|----------|----------|
| No puedo acceder desde mi PC | Verificar firewall: `sudo ufw allow 3000` |
| 401 Unauthorized | Verificar que CMX_API_KEY sea igual en servidor y cliente |
| 404 Not Found | Verificar CMX_BASE_PATH coincida en ambos lados |
| Servidor no inicia | Verificar puerto no está en uso: `lsof -i :3000` |

---

## ✅ Deployment Completado

Cuando todos los pasos estén marcados, ¡ya tienes cmx-memories desplegado!

```
┌─────────────────────────────────────────────┐
│  🎉 cmx-memories está funcionando!        │
│                                             │
│  Servidor: http://IP:3000/cmx-memories     │
│  API Key: configurada                       │
│  Estado: ✓ Operativo                        │
└─────────────────────────────────────────────┘
```

---

*Imprime esta checklist o marca los pasos en tu editor favorito*
