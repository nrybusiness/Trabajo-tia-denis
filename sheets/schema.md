# Schema de Google Sheets

Definición exacta de columnas para cada hoja del backend. Esta es la referencia que usa `Core/Config.gs` para mapear celdas.

> ⚠️ **Importante:** El orden de las columnas debe respetarse exactamente. Si cambias el orden, debes actualizar `Core/Config.gs`.

---

## Hoja: `Productos`

| Col | Nombre | Tipo | Ejemplo |
|---|---|---|---|
| A | producto_id | TEXT | `P001` |
| B | nombre | TEXT | `Leggins BiTone Azul-Rosado` |
| C | categoria | TEXT | `Leggins` |
| D | activo | BOOL | `TRUE` |

**Fila 1:** headers literales (`producto_id`, `nombre`, `categoria`, `activo`).

---

## Hoja: `Variantes`

| Col | Nombre | Tipo | Ejemplo |
|---|---|---|---|
| A | sku | TEXT | `P001-SM` |
| B | producto_id | TEXT | `P001` |
| C | talla | TEXT | `SM` / `LXL` / `U` |
| D | costo | NUMBER | `47389` |
| E | precio_duena | NUMBER | `109900` |
| F | precio_oferta | NUMBER | `65000` |
| G | activo | BOOL | `TRUE` |

---

## Hoja: `Vendedoras`

| Col | Nombre | Tipo | Ejemplo |
|---|---|---|---|
| A | vendedora_id | TEXT | `V02` |
| B | nombre | TEXT | `Nataly` |
| C | email | TEXT | `nataly@gmail.com` |
| D | rol | TEXT | `vendedora` |
| E | activo | BOOL | `TRUE` |

---

## Hoja: `Stock`

| Col | Nombre | Tipo | Ejemplo |
|---|---|---|---|
| A | sku | TEXT | `P001-SM` |
| B | vendedora_id | TEXT | `V02` |
| C | cantidad | NUMBER | `1` |

---

## Hoja: `Movimientos`

| Col | Nombre | Tipo | Ejemplo |
|---|---|---|---|
| A | mov_id | TEXT | `M0001` |
| B | fecha | TEXT (ISO8601) | `2026-04-09T10:00:00-05:00` |
| C | tipo | TEXT | `VENTA` |
| D | sku | TEXT | `P001-SM` |
| E | cantidad | NUMBER | `1` |
| F | vendedora_id | TEXT | `V02` |
| G | destino_id | TEXT | `V01` (o vacío) |
| H | notas | TEXT | `Cliente María` |
| I | usuario_email | TEXT | `nataly@gmail.com` |

---

## Hoja: `Config`

| Col | Nombre | Tipo | Ejemplo |
|---|---|---|---|
| A | clave | TEXT | `moneda` |
| B | valor | TEXT | `COP` |
| C | descripcion | TEXT | `Moneda del sistema` |

---

## Inicialización

La función `instalarSistema()` (en `Core/Installer.gs`) crea automáticamente las 6 hojas con sus headers correctos y carga los datos seed (vendedoras, config). No es necesario crear las hojas manualmente.
