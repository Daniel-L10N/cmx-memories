# CMX-WEB-SITE - Proyecto Control Modular MX

## Descripción General

Proyecto full-stack para **Control Modular MX**, empresa mexicana especializada en:
- Diseño de tarjetas electrónicas (PCB)
- Desarrollo de software industrial
- Domótica y automatización
- Mantenimiento de equipos industriales

**Ubicación:** Atenco, Estado de México  
**Contacto:** +52 552 568 6595  
**Email:** controlmodularmx@gmail.com

---

## Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                       │
│         https://controlmodularmx.vercel.app                 │
│              controlmodularmx.com (dominio)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Servidor Ubuntu)                   │
│        https://cmxserver.curlew-vector.ts.net/cmx/          │
│                    Gunicorn + Django                         │
│                    Puerto: 8000                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Repositorios

| Proyecto | URL | Descripción |
|----------|-----|-------------|
| Frontend | https://github.com/Daniel-L10N/control-modular-mx-frontend | Next.js, TypeScript, Tailwind |
| Backend | https://github.com/Daniel-L10N/cmx-site-backend | Django, DRF, Python |

---

## Frontend - Stack Tecnológico

### Tecnologías
- **Framework:** Next.js 14+ (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **UI Icons:** Heroicons, react-icons
- **Deployment:** Vercel

### Estructura de Archivos
```
control-modular-mx-frontend/
├── app/
│   ├── lib/config.ts           # Configuración de API
│   ├── page.tsx               # Página principal
│   ├── productos/
│   │   ├── page.tsx           # Catálogo de productos
│   │   └── tarjeta-rebanadora-bizerba/page.tsx
│   ├── nosotros/page.tsx       # Página nosotros (API)
│   ├── contacto/page.tsx       # Formulario de contacto
│   └── components/
│       ├── Navegacion/
│       │   ├── Navbar.tsx
│       │   └── Footer.tsx
│       ├── Inicio/
│       │   ├── Header.tsx
│       │   ├── Incentives.tsx
│       │   ├── Features.tsx
│       │   ├── UseWorks.tsx
│       │   ├── CTA.tsx
│       │   └── LogoCloud.tsx
│       └── WhatsAppButton.tsx
├── public/icons/              # Iconos locales
├── next.config.ts
└── package.json
```

### Variables de Entorno (Vercel)
```
NEXT_PUBLIC_API_URL = https://cmxserver.curlew-vector.ts.net/cmx/api
```

### Endpoints del Backend Consumidos
| Endpoint | Uso |
|----------|-----|
| `/api/catalogo/productos/` | Listado de productos |
| `/api/catalogo/productos/{slug}/` | Detalle de producto |
| `/api/catalogo/productos/relacionados/{categoria}/` | Productos relacionados |
| `/api/empresa/info/` | Datos de empresa (hero, historia, equipo) |
| `/api/contacto/contacto/` | Envío de formularios |

### Componentes Principales

#### WhatsAppButton.tsx
Botón flotante de WhatsApp en esquina inferior derecha.
- Logo oficial con react-icons (FaWhatsapp)
- Tooltip "¿Necesitas ayuda?"
- Link: `https://wa.me/525525686595`
- Mensaje predefinido de contacto

#### contacto/page.tsx
Formulario de contacto conectado al backend.
- Campos: nombre, empresa, email, teléfono, servicio, mensaje
- Servicios: Hardware (PCB), Software Industrial, Domótica, 3D, Soporte
- POST a `/api/contacto/contacto/`
- Estados: idle, success, error

---

## Backend - Stack Tecnológico

### Tecnologías
- **Framework:** Django 4+
- **API:** Django REST Framework
- **Base de datos:** SQLite (desarrollo)
- **Servidor:** Gunicorn
- **Proxy:** Nginx
- **Sistema:** Ubuntu Server (Tailscale)

### Estructura de Aplicaciones
```
cmx-site-backend/
├── config/
│   ├── settings.py           # Configuración principal
│   ├── urls.py               # Rutas principales
│   └── wsgi.py
├── apps/
│   ├── catalogo/             # Catálogo de productos
│   │   ├── models.py         # Categoria, Producto, Especificacion
│   │   ├── serializers.py    # Serializers con URLs HTTPS
│   │   ├── views.py
│   │   └── urls.py
│   ├── empresa/              # Información de empresa
│   │   ├── models.py         # InfoEmpresa, MiembroEquipo, Valor, Estadistica
│   │   ├── serializers.py
│   │   └── urls.py
│   └── contacto/             # Mensajes de contacto
│       ├── models.py         # Contacto
│       ├── serializers.py
│       ├── views.py
│       └── admin.py
├── templates/
│   └── cmx_login.html        # Login custom sin CSRF
├── media/                    # Archivos subidos
├── staticfiles/              # Archivos estáticos
└── requirements.txt
```

### Configuración de Producción

#### settings.py - Variables Clave
```python
PRODUCTION = True
FORCE_SCRIPT_NAME = '/cmx'

ALLOWED_HOSTS = [
    'cmxserver.curlew-vector.ts.net',
    'controlmodularmx.com',
    'www.controlmodularmx.com',
    'controlmodularmx.vercel.app'
]

CSRF_TRUSTED_ORIGINS = [
    'https://cmxserver.curlew-vector.ts.net',
    'https://controlmodularmx.com',
    'https://www.controlmodularmx.com',
    'https://controlmodularmx.vercel.app'
]

CORS_ALLOWED_ORIGINS = [
    'https://controlmodularmx.com',
    'https://www.controlmodularmx.com',
    'https://controlmodularmx.vercel.app'
]

MEDIA_URL = 'https://cmxserver.curlew-vector.ts.net/cmx/media/'
```

#### Serializers - URLs HTTPS Forzadas
```python
BASE_URL = 'https://cmxserver.curlew-vector.ts.net/cmx/media/'

def build_media_url(relative_url):
    if not relative_url:
        return None
    if relative_url.startswith('http'):
        return relative_url
    return BASE_URL + relative_url
```

### Rutas de API
| Ruta | Método | Descripción |
|------|--------|-------------|
| `/cmx/admin/` | GET | Admin Django (login custom) |
| `/cmx/admin/login/` | POST | Login sin CSRF |
| `/cmx/api/catalogo/` | GET | Lista de categorías y productos |
| `/cmx/api/catalogo/categorias/` | GET | Listado categorías |
| `/cmx/api/catalogo/productos/` | GET | Listado productos |
| `/cmx/api/catalogo/productos/{slug}/` | GET | Detalle producto |
| `/cmx/api/empresa/info/` | GET | Info empresa completa |
| `/cmx/api/contacto/contacto/` | POST | Recibir mensaje |

### Login Custom (cmx_admin_login)
Solución para el problema de CSRF con prefijo `/cmx/`:
```python
@csrf_exempt
def cmx_admin_login(request):
    # Autenticación sin verificación CSRF
    # Renderiza template cmx_login.html
```

---

## Despliegue Backend

### Servicio Systemd
**Archivo:** `/etc/systemd/system/cmx-backend.service`
```ini
[Unit]
Description=CMX Backend Django Service
After=network.target

[Service]
Type=simple
User=cmx
WorkingDirectory=/home/cmx/www/cmx
Environment=PATH=/home/cmx/www/cmx/venv/bin
ExecStart=/home/cmx/www/cmx/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

### Configuración Nginx
**Archivo:** `/etc/nginx/sites-available/cmx`
```nginx
server {
    listen 80;
    server_name _;

    location /cmx/static/ {
        alias /home/cmx/www/cmx/staticfiles/;
        expires 30d;
    }

    location /cmx/media/ {
        alias /home/cmx/www/cmx/media/;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
    }

    location /cmx/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
    }
}
```

### Comandos de Gestión
```bash
# Iniciar servicio
sudo systemctl start cmx-backend

# Reiniciar
sudo systemctl restart cmx-backend

# Ver logs
sudo journalctl -u cmx-backend -f

# Recolectar estáticos
source venv/bin/activate
python manage.py collectstatic --noinput

# Migraciones
python manage.py migrate
```

### Actualización desde GitHub
```bash
cd /home/cmx/www/cmx
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart cmx-backend
```

---

## SEO Implementado

### Meta Tags
- Title dinámico por página
- Description desde API
- OpenGraph para redes sociales
- Twitter cards

### Schema.org (JSON-LD)
- Product schema en páginas de productos
- Datos estructurados para Google

### URLs Amigables
- Slugs para productos: `/productos/tarjeta-rebanadora-bizerba/`
- Nombres descriptivos

---

## CREDENCIALES

### Admin Django
- **URL:** https://cmxserver.curlew-vector.ts.net/cmx/admin/
- **Usuario:** cmx
- **Contraseña:** cmx*123

**IMPORTANTE:** Cambiar en producción

---

## Problemas Resueltos

### 1. CSRF con prefijo /cmx/
**Problema:** Django admin redirige a `/admin/login/` sin prefijo  
**Solución:** Login custom con `@csrf_exempt` y template propio

### 2. URLs HTTP en producción
**Problema:** Imágenes servidas con `http://` causan mixed content  
**Solución:** Serializers usan `BASE_URL` con `https://`

### 3. TailwindUI CDN bloqueado
**Problema:** Iconos SVG de tailwindui.com bloqueados por CORS  
**Solución:** Descargar SVGs a `public/icons/` y servir localmente

### 4. CORS en Vercel
**Problema:** Browser bloquea peticiones cross-origin  
**Solución:** Configurar `CORS_ALLOWED_ORIGINS` con dominios Vercel

---

## Próximos Pasos Sugeridos

1. [ ] Cambiar credenciales admin
2. [ ] Configurar SSL/HTTPS en el servidor
3. [ ] Implementar cache Redis/Memcached
4. [ ] Agregar sistema de usuarios/auth
5. [ ] Dashboard de estadísticas
6. [ ] Sistema de newsletters
7. [ ] Blog con CMS

---

## Documentación Relacionada

- `DEPLOY.md` - Guía de despliegue
- `DEPLOY-CHECKLIST.md` - Checklist de producción
- Repositorios GitHub para código fuente

---

*Documento generado: Abril 2026*
*Proyecto activo y en desarrollo*
