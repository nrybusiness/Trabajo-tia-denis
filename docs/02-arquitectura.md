# 02 — Arquitectura del Sistema

## 1. Visión general

El sistema sigue una arquitectura **modular en capas** con **Separación de Responsabilidades (SoC)** estricta. Cada capa solo puede comunicarse con la capa inmediatamente inferior.

```
┌─────────────────────────────────────────────────────┐
│  Views/         HTML + CSS + JS del ADS             │
│                 (lo que ve el usuario)              │
├─────────────────────────────────────────────────────┤
│  Interface/     WebApp.gs + ApiController.gs        │
│                 (entry points HTTP, auth guard)     │
├─────────────────────────────────────────────────────┤
│  Logic/         Services (reglas de negocio puras)  │
│                 (no tocan Sheets directamente)      │
├─────────────────────────────────────────────────────┤
│  Data/          DAOs (acceso a Google Sheets)       │
│                 (CRUD sobre filas, no sabe nada     │
│                  de reglas de negocio)              │
├─────────────────────────────────────────────────────┤
│  Core/          Config, constantes, utils           │
│                 (compartido por todas las capas)    │
└─────────────────────────────────────────────────────┘
```

## 2. Regla de oro

> **Una capa NUNCA puede saltarse la capa inmediatamente inferior.**

Ejemplos:
- ❌ `ApiController` NO puede llamar directo a `StockDAO`. Debe pasar por `VentasService`.
- ❌ Un archivo en `Views/` NO puede llamar directo a un `Service`. Debe pasar por `google.script.run` hacia `ApiController`.
- ❌ Un `Service` NO puede usar `SpreadsheetApp` directamente. Debe pasar por un DAO.

Esta regla garantiza que podamos cambiar el backend (ej. migrar de Sheets a Firestore) tocando solo la capa `Data/`.

## 3. Estructura de archivos

```
apps-script/
├── Core/
│   ├── Config.gs              IDs de hojas, rangos, constantes de entorno
│   ├── Constants.gs           Enums: TIPOS_MOVIMIENTO, ROLES, TALLAS, ESTADOS
│   └── Utils.gs               Helpers: generarId, formatearMoneda, fechaISO
│
├── Data/
│   ├── ProductosDAO.gs        CRUD de productos
│   ├── VariantesDAO.gs        CRUD de variantes (SKUs)
│   ├── StockDAO.gs            Lectura/actualización de stock por SKU/vendedora
│   ├── VendedorasDAO.gs       CRUD de vendedoras y lookup por email
│   └── MovimientosDAO.gs      Append-only de la bitácora
│
├── Logic/
│   ├── InventarioService.gs   Vista agregada del inventario global
│   ├── KardexService.gs       Kardex por vendedora
│   ├── VentasService.gs       Procesar ventas con validaciones
│   ├── EntregasService.gs     Procesar devoluciones a dueña
│   ├── PreciosService.gs      Listado con disponibilidad
│   ├── ReportesService.gs     Dashboard y estadísticas
│   ├── CatalogoService.gs     CRUD productos/variantes (admin)
│   ├── AdminVendedorasService.gs   Alta/baja/reasignación (superadmin)
│   ├── BitacoraService.gs     Consulta y filtrado de movimientos
│   └── ConfigService.gs       Lectura/escritura de parámetros
│
├── Interface/
│   ├── WebApp.gs              doGet() — sirve el HTML del ADS
│   ├── ApiController.gs       Endpoints llamados desde el frontend
│   └── AuthGuard.gs           Valida rol antes de ejecutar endpoints
│
└── Views/
    ├── index.html             Shell principal (router por rol)
    ├── styles.html            CSS global
    ├── app.js.html            Router + fetch helpers
    │
    ├── operativo/
    │   ├── view_kardex.html
    │   ├── view_ventas.html
    │   ├── view_entregas.html
    │   └── view_precios.html
    │
    └── admin/
        ├── view_dashboard.html
        ├── view_catalogo.html
        ├── view_vendedoras.html
        ├── view_bitacora.html
        └── view_config.html
```

## 4. Flujo de una operación (ejemplo: registrar venta)

```
Usuario hace click en "Vender" en view_ventas.html
    │
    ▼
app.js.html → google.script.run.apiRegistrarVenta({sku, cantidad, vendedora_id})
    │
    ▼
ApiController.apiRegistrarVenta(payload)
    │
    ├──▶ AuthGuard.requireRol(['superadmin','admin','vendedora'])
    │
    ▼
VentasService.registrarVenta(payload)
    │
    ├──▶ VariantesDAO.obtenerPorSku(sku)           ← valida que exista
    ├──▶ StockDAO.obtenerStock(sku, vendedora_id)  ← valida disponibilidad
    ├──▶ MovimientosDAO.append({tipo:'VENTA',...}) ← escribe bitácora
    └──▶ StockDAO.decrementar(sku, vendedora_id, cantidad)
    │
    ▼
Retorna {ok: true, movimiento_id: 'M0123'}
    │
    ▼
app.js.html refresca la vista del kardex
```

## 5. Autenticación y autorización

**Mecanismo:** Google nativa vía `Session.getActiveUser().getEmail()`.

**Flujo:**
1. Usuario abre el WebApp (el URL de despliegue).
2. Apps Script captura su email de Google automáticamente.
3. `AuthGuard.obtenerUsuarioActual()` busca ese email en la hoja `Vendedoras`.
4. Si existe y está activa, retorna `{vendedora_id, nombre, rol}`.
5. Si no existe, el ADS muestra una pantalla de "Acceso no autorizado".

**Matriz de permisos:** ver [`docs/01-requisitos.md`](01-requisitos.md) sección 2.

## 6. Modelo de datos

Ver [`docs/03-modelo-datos.md`](03-modelo-datos.md) para el schema detallado.

Resumen de las 6 hojas:

| Hoja | Propósito | Llave primaria |
|---|---|---|
| `Productos` | Catálogo maestro de prendas | `producto_id` |
| `Variantes` | SKUs (producto + talla + precios) | `sku` |
| `Vendedoras` | Usuarios del sistema con rol | `vendedora_id` |
| `Stock` | Stock actual por SKU y poseedor | `sku + vendedora_id` |
| `Movimientos` | Bitácora append-only | `mov_id` |
| `Config` | Parámetros del sistema | `clave` |

## 7. Decisiones arquitectónicas clave

### D-01 — Google Sheets como base de datos
**Decisión:** Usar Sheets en vez de Firestore o una BD externa.
**Razón:** Petición explícita del cliente. Cero costo. Ya está en el ecosistema. Permite que el admin abra el Sheet crudo si algún día es necesario.
**Trade-off aceptado:** Performance limitada (~50 req/s) y escalabilidad tope de ~5M celdas. Suficiente para este caso de uso.

### D-02 — Movimientos como append-only
**Decisión:** La hoja `Movimientos` nunca se edita ni se borra, solo se agregan filas.
**Razón:** Auditoría total. El stock se puede reconstruir 100% desde los movimientos, lo que garantiza integridad y permite reversar errores sin perder historia.

### D-03 — Stock desnormalizado como caché
**Decisión:** Mantener una hoja `Stock` separada aunque se podría calcular desde `Movimientos`.
**Razón:** Performance. Calcular stock en cada consulta sería inaceptable con cientos de SKUs. La hoja `Stock` es un caché que se actualiza en cada movimiento.
**Mitigación:** Función `ReportesService.recalcularStock()` para reconstruir desde movimientos si hay desincronización.

### D-04 — Auth con email de Google
**Decisión:** No implementar login custom con contraseñas.
**Razón:** Seguro, gratis, sin mantenimiento, sin manejar hashes ni sesiones.
**Requisito:** Todas las usuarias deben tener cuenta Google.

### D-05 — Separación Views operativo/admin
**Decisión:** Carpetas `Views/operativo/` y `Views/admin/` separadas.
**Razón:** El router del ADS carga un bundle u otro según rol. Evita que código admin llegue al frontend de vendedoras.

### D-06 — Sin dependencias externas
**Decisión:** Todo el frontend usa Vanilla JS + CSS, sin React/Vue/librerías.
**Razón:** Apps Script tiene limitaciones con CDNs y bundlers. Vanilla es más simple, más rápido de cargar, y 100% compatible con `HtmlService`.

## 8. Convenciones de código

- **Nombres de funciones públicas del backend:** camelCase, prefijo `api` para endpoints (`apiRegistrarVenta`).
- **Nombres de funciones privadas:** camelCase con prefijo `_` (`_validarSku`).
- **Constantes:** SCREAMING_SNAKE_CASE.
- **IDs generados:** prefijo por entidad (`P001` producto, `V02` vendedora, `M0045` movimiento).
- **Fechas:** ISO 8601 con zona horaria (`2026-04-09T14:30:00-05:00`).
- **Moneda:** enteros en COP (sin decimales). Formateo solo en capa de presentación.
