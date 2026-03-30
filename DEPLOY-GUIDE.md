# Guía de Despliegue - cmx-memories

> Esta guía te lleva paso a paso para desplegar cmx-memories en un servidor remoto o usarlo localmente.

---

## Tabla de Contenido

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación](#instalación)
3. [Configuración Inicial](#configuración-inicial)
4. [Despliegue Local](#despliegue-local)
5. [Despliegue Remoto](#despliegue-remoto)
6. [Configurar el Cliente (OpenCode)](#configurar-el-cliente-opencode)
7. [Verificación](#verificación)
8. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

### En el Servidor (PC remoto)
- [ ] **Node.js** 18+ instalado
- [ ] **npm** o **yarn**
- [ ] Puerto `3000` disponible (o configurar otro puerto)
- [ ] Acceso SSH (para gestión remota)

### En tu PC Local
- [ ] **OpenCode** instalado
- [ ] Acceso a internet (si el servidor es remoto)

---

## Instalación

### Paso 1: Copiar el proyecto al servidor

```bash
# Opción A: Git (recomendado)
git clone https://github.com/TU-USUARIO/cmx-memories.git
cd cmx-memories

# Opción B: SFTP/Scp
# Copia la carpeta cmx-memories al servidor
```

### Paso 2: Instalar dependencias

```bash
cd cmx-memories
npm install
```

### Paso 3: Compilar el proyecto

```bash
npm run build
```

---

## Configuración Inicial

### Paso 1: Copiar archivo de entorno

```bash
cp .env.example .env
```

### Paso 2: Editar configuración

Abre el archivo `.env` y configura:

```bash
# Puerto del servidor
CMX_API_PORT=3000

# Host (0.0.0.0 para accesible desde red)
CMX_API_HOST=0.0.0.0

# IMPORTANTE: Cambia esta clave en producción
CMX_API_KEY=tu-clave-segura-aqui

# Path base (descomenta si usas subpath)
# CMX_BASE_PATH=/cmx-memories
```

---

## Despliegue Local

### Opción 1: Servidor básico (recomendado para pruebas)

```bash
npm run api
```

- **URL**: http://127.0.0.1:3000
- **Health**: http://127.0.0.1:3000/health

### Opción 2: Con subpath (para pruebas de despliegue)

```bash
npm run api:subpath
```

- **URL**: http://127.0.0.1:3000/cmx-memories
- **Health**: http://127.0.0.1:3000/cmx-memories/health

---

## Despliegue Remoto

### Opción 1: Servidor básico (sin subpath)

```bash
npm run api:remote
```

- **URL**: http://TU-IP-O-DOMINIO:3000
- **Puerto**: 3000

### Opción 2: Con subpath (RECOMENDADO para producción)

```bash
npm run api:subpath:remote
```

- **URL**: http://TU-IP-O-DOMINIO:3000/cmx-memories
- **Puerto**: 3000
- **Health**: http://TU-IP-O-DOMINIO:3000/cmx-memories/health

---

## Configurar el Cliente (OpenCode)

### Variables de entorno para OpenCode

Antes de ejecutar OpenCode, configura estas variables:

```bash
# Para servidor remoto
export CMX_MEMORIES_HOST="192.168.1.100"  # IP o dominio del servidor
export CMX_MEMORIES_PORT="3000"
export CMX_MEMORIES_BASE_PATH="/cmx-memories"  # O vacío si no usas subpath
export CMX_API_KEY="tu-clave-segura-aqui"  # La misma clave del servidor
```

### Para Windows (PowerShell)

```powershell
$env:CMX_MEMORIES_HOST="192.168.1.100"
$env:CMX_MEMORIES_PORT="3000"
$env:CMX_MEMORIES_BASE_PATH="/cmx-memories"
$env:CMX_API_KEY="tu-clave-segura-aqui"
```

### Para permanente configuración

Crea un archivo `.env` en la raíz de tu proyecto OpenCode:

```
CMX_MEMORIES_HOST=192.168.1.100
CMX_MEMORIES_PORT=3000
CMX_MEMORIES_BASE_PATH=/cmx-memories
CMX_API_KEY=tu-clave-segura-aqui
```

---

## Verificación

### 1. Verificar que el servidor está corriendo

```bash
curl http://TU-SERVIDOR:3000/cmx-memories/health
```

Debería responder:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "basePath": "/cmx-memories",
  "version": "1.0.0"
}
```

### 2. Verificar conexión desde OpenCode

Cuando inicies OpenCode,，你应该 ver:
```
cmx-memories API running at http://TU-SERVIDOR:3000/cmx-memories
```

---

## Solución de Problemas

### ❌ "Connection refused"

**Causa**: El servidor no está corriendo.

**Solución**:
```bash
# En el servidor
cd cmx-memories
npm run api:remote
```

### ❌ "401 Unauthorized"

**Causa**: La API key no coincide.

**Solución**: Verifica que la variable `CMX_API_KEY` sea la misma en:
1. El archivo `.env` del servidor
2. La variable de entorno `CMX_API_KEY` en tu PC local

### ❌ "404 Not Found"

**Causa**: El base path no coincide.

**Solución**:
- Si el servidor usa `/cmx-memories`, configura `CMX_MEMORIES_BASE_PATH=/cmx-memories`
- Si el servidor NO usa base path, deja `CMX_MEMORIES_BASE_PATH` vacío

### ❌ "ECONNREFUSED"

**Causa**: No puede conectar al servidor.

**Solución**:
1. Verifica que el puerto 3000 esté abierto en el firewall:
   ```bash
   sudo ufw allow 3000
   ```
2. Verifica que el host sea `0.0.0.0` (no `127.0.0.1`) en el servidor

---

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run api` | Servidor local básico |
| `npm run api:remote` | Servidor remoto (accesible desde red) |
| `npm run api:subpath` | Servidor local con `/cmx-memories` |
| `npm run api:subpath:remote` | Servidor remoto con `/cmx-memories` |
| `npm run build` | Compilar TypeScript |
| `./scripts/deploy.sh [modo]` | Script de despliegue automatizado |

---

## Producción Recomendada

Para un despliegue más robusto:

1. **Usar PM2** (gestor de procesos):
   ```bash
   npm install -g pm2
   pm2 start "npm run api:subpath:remote" --name cmx-memories
   pm2 save
   pm2 startup  # Para auto-inicio al reiniciar
   ```

2. **Nginx como reverse proxy** (opcional):
   - Ver archivo `nginx.example.conf`

3. **SSL con Let's Encrypt** (opcional):
   ```bash
   sudo apt install certbot
   sudo certbot --nginx -d tu-dominio.com
   ```

---

## Checklist Final

Antes de empezar a usar:

- [ ] Servidor instalado y compilado
- [ ] Archivo `.env` configurado
- [ ] Servidor corriendo (`npm run api:subpath:remote`)
- [ ] Puerto 3000 abierto en firewall
- [ ] Health check respondiendo
- [ ] OpenCode configurado con las variables correctas
- [ ] Primera conexión exitosa

---

## Soporte

Si tienes problemas:
1. Revisa la sección de [Solución de Problemas](#solución-de-problemas)
2. Verifica los logs del servidor
3. Consulta el archivo `DEPLOY.md` para más detalles técnicos

---

*Última actualización: 2026*
