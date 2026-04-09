# Sistema de Inventario INFINITY

Sistema de gestión de inventario para venta de prendas deportivas, construido sobre **Google Sheets** como backend, **Google Apps Script** como capa de lógica, y un **ADS (Admin Display System)** en HTML para la administración visual.

## 🎯 Objetivo

Reemplazar el manejo manual del inventario en hojas de cálculo por un sistema estructurado que permita:

- Registrar ventas con descuento automático de stock.
- Diferenciar ventas por vendedora (Nataly, Carolina) y por la dueña (Lorena).
- Mantener kardex individuales por vendedora sincronizados con el inventario global.
- Consultar precios y disponibilidad en tiempo real durante una venta.
- Generar reportes de resultados, productos más vendidos, stock valorizado y más.

## 👥 Actores

| Rol | Nombre | Descripción |
|---|---|---|
| `superadmin` | Desarrollador | Acceso total al sistema, configuración y ajustes críticos. |
| `admin` | Lorena | Dueña del inventario. Ve dashboard, gestiona catálogo y precios. |
| `vendedora` | Nataly | Vende y gestiona su propio kardex. |
| `vendedora` | Carolina | Vende y gestiona su propio kardex. |

## 🏗️ Arquitectura

Arquitectura modular en 5 capas con separación estricta de responsabilidades:

```
┌─────────────────────────────────────────────────┐
│  Views/         ← HTML/CSS/JS (ADS)             │
├─────────────────────────────────────────────────┤
│  Interface/     ← WebApp + API Controller       │
├─────────────────────────────────────────────────┤
│  Logic/         ← Services (reglas de negocio)  │
├─────────────────────────────────────────────────┤
│  Data/          ← DAOs (acceso a Sheets)        │
├─────────────────────────────────────────────────┤
│  Core/          ← Config, constantes, utils     │
└─────────────────────────────────────────────────┘
```

Ver [`docs/02-arquitectura.md`](docs/02-arquitectura.md) para el detalle completo.

## 📁 Estructura del repositorio

```
Trabajo-tia-denis/
├── README.md                 ← este archivo
├── docs/                     ← documentación funcional y técnica
├── data/                     ← CSVs originales y migrados
├── sheets/                   ← definición del schema de Google Sheets
├── apps-script/              ← código del backend + frontend ADS
├── scripts/                  ← utilidades (migración, backups)
└── dev/                      ← notas internas de desarrollo
```

## 🚀 Despliegue rápido

1. Crear un nuevo Google Sheet y anotar su ID.
2. Abrir `Extensiones → Apps Script`.
3. Copiar el contenido de `apps-script/` en el editor respetando la estructura de archivos.
4. Configurar el ID del Sheet en `Core/Config.gs`.
5. Ejecutar la función `instalarSistema()` una sola vez para crear las hojas base.
6. Desplegar como WebApp: `Implementar → Nueva implementación → Aplicación web`.
   - Ejecutar como: `Usuario que accede`
   - Acceso: `Cualquiera con la cuenta de Google`
7. Compartir el URL del WebApp con Lorena, Nataly y Carolina.

Ver [`docs/05-guia-usuario.md`](docs/05-guia-usuario.md) para el manual completo.

## 🛠️ Stack técnico

- **Backend:** Google Sheets + Google Apps Script (V8 runtime)
- **Frontend:** HtmlService + Vanilla JS + CSS
- **Auth:** Google nativa (`Session.getActiveUser()`)
- **Versionado:** Git + GitHub
- **Sin dependencias externas** — todo corre dentro del ecosistema Google gratis.

## 📖 Documentación

| Documento | Contenido |
|---|---|
| [`docs/01-requisitos.md`](docs/01-requisitos.md) | Requisitos funcionales y no funcionales extraídos del cliente. |
| [`docs/02-arquitectura.md`](docs/02-arquitectura.md) | Decisiones arquitectónicas y diagramas. |
| [`docs/03-modelo-datos.md`](docs/03-modelo-datos.md) | Schema de las 6 hojas y relaciones. |
| [`docs/04-api-reference.md`](docs/04-api-reference.md) | Endpoints del ApiController. |
| [`docs/05-guia-usuario.md`](docs/05-guia-usuario.md) | Manual para admin y vendedoras. |

## 📜 Licencia

Uso privado — cliente INFINITY.
