# 03 — Modelo de Datos

Schema completo de las 6 hojas que componen el backend del sistema.

## 1. Diagrama relacional

```
┌──────────────┐       ┌──────────────┐
│  Productos   │ 1───N │   Variantes  │
│  producto_id │       │     sku      │
│  nombre      │       │  producto_id │
│  categoria   │       │  talla       │
│  activo      │       │  costo       │
└──────────────┘       │  precio_d    │
                       │  precio_o    │
                       └──────┬───────┘
                              │ 1
                              │
                              │ N
                       ┌──────▼───────┐       ┌──────────────┐
                       │    Stock     │ N───1 │  Vendedoras  │
                       │     sku      │       │ vendedora_id │
                       │ vendedora_id │       │ nombre       │
                       │  cantidad    │       │ email        │
                       └──────────────┘       │ rol          │
                              ▲               │ activo       │
                              │               └──────┬───────┘
                              │                      │
                              │ actualiza            │
                              │                      │
                       ┌──────┴───────┐              │
                       │ Movimientos  │◀─────────────┘
                       │   mov_id     │   registra
                       │   fecha      │
                       │   tipo       │
                       │   sku        │
                       │   cantidad   │
                       │ vendedora_id │
                       │ destino_id   │
                       │   notas      │
                       └──────────────┘

┌──────────────┐
│    Config    │
│    clave     │
│    valor     │
└──────────────┘
```

## 2. Hoja `Productos`

Catálogo maestro de prendas. Una fila = un producto conceptual.

| Columna | Tipo | Requerido | Descripción |
|---|---|:---:|---|
| `producto_id` | string | ✅ | PK. Formato `P###` (ej. `P001`). |
| `nombre` | string | ✅ | Nombre comercial (ej. *"Leggins BiTone Azul-Rosado"*). |
| `categoria` | string | ✅ | Categoría (ej. *Leggins*, *Tops*, *Shorts*, *Bodies*). |
| `activo` | boolean | ✅ | `TRUE` si el producto está disponible, `FALSE` si descontinuado. |

**Ejemplo:**

| producto_id | nombre | categoria | activo |
|---|---|---|---|
| P001 | Leggins BiTone Azul-Rosado | Leggins | TRUE |
| P002 | Hoodie BiTone Azul-Rosado | Hoodies | TRUE |

## 3. Hoja `Variantes`

Un SKU por cada combinación producto + talla. Aquí viven los precios y costos.

| Columna | Tipo | Requerido | Descripción |
|---|---|:---:|---|
| `sku` | string | ✅ | PK. Formato `{producto_id}-{talla}` (ej. `P001-SM`). |
| `producto_id` | string | ✅ | FK a `Productos`. |
| `talla` | enum | ✅ | `UNICA`, `SM`, `LXL`. |
| `costo` | integer | ✅ | Costo en COP (sin decimales). |
| `precio_duena` | integer | ✅ | Precio oficial de la dueña en COP. |
| `precio_oferta` | integer | ✅ | Precio con el que la vendedora lo comercializa en COP. |
| `activo` | boolean | ✅ | Permite desactivar una talla sin borrar el producto. |

**Convención de talla en SKU:**
- `S/M` → `SM`
- `L/XL` → `LXL`
- `UNICA` → `U`

**Ejemplo:**

| sku | producto_id | talla | costo | precio_duena | precio_oferta | activo |
|---|---|---|---|---|---|---|
| P001-SM | P001 | SM | 47389 | 109900 | 65000 | TRUE |
| P001-LXL | P001 | LXL | 47389 | 109900 | 65000 | TRUE |
| P002-U | P002 | U | 33630 | 84900 | 60000 | TRUE |

## 4. Hoja `Vendedoras`

Usuarias del sistema. También sirve como tabla de autenticación.

| Columna | Tipo | Requerido | Descripción |
|---|---|:---:|---|
| `vendedora_id` | string | ✅ | PK. Formato `V##` (ej. `V01`). |
| `nombre` | string | ✅ | Nombre para mostrar. |
| `email` | string | ✅ | Email de Google. Usado para autenticación. |
| `rol` | enum | ✅ | `superadmin`, `admin`, `vendedora`. |
| `activo` | boolean | ✅ | `FALSE` impide login. |

**Seed inicial:**

| vendedora_id | nombre | email | rol | activo |
|---|---|---|---|---|
| V00 | Desarrollador | superadmin@placeholder.com | superadmin | TRUE |
| V01 | Lorena | lorena@placeholder.com | admin | TRUE |
| V02 | Nataly | nataly@placeholder.com | vendedora | TRUE |
| V03 | Carolina | carolina@placeholder.com | vendedora | TRUE |

## 5. Hoja `Stock`

Stock actual por SKU y poseedor. **Fuente de verdad operativa** (caché sincronizado con `Movimientos`).

| Columna | Tipo | Requerido | Descripción |
|---|---|:---:|---|
| `sku` | string | ✅ | FK a `Variantes`. Parte 1 de PK compuesta. |
| `vendedora_id` | string | ✅ | FK a `Vendedoras`. Parte 2 de PK compuesta. |
| `cantidad` | integer | ✅ | Unidades físicas en poder de esa vendedora. Nunca negativo. |

**Invariantes:**
- `cantidad >= 0` siempre.
- Par `(sku, vendedora_id)` es único.
- **Inventario global** de un SKU = `SUM(cantidad)` donde `sku = X`.
- **Kardex de una vendedora** = filas donde `vendedora_id = X` con `cantidad > 0`.

**Ejemplo:**

| sku | vendedora_id | cantidad |
|---|---|---|
| P001-SM | V01 | 0 |
| P001-SM | V02 | 1 |
| P001-SM | V03 | 0 |
| P001-LXL | V02 | 1 |
| P002-U | V01 | 5 |
| P002-U | V02 | 1 |

## 6. Hoja `Movimientos`

Bitácora inmutable (append-only) de todas las transacciones. Fuente de verdad histórica.

| Columna | Tipo | Requerido | Descripción |
|---|---|:---:|---|
| `mov_id` | string | ✅ | PK. Formato `M####` (ej. `M0001`). |
| `fecha` | ISO8601 | ✅ | Timestamp con zona horaria (`2026-04-09T14:30:00-05:00`). |
| `tipo` | enum | ✅ | `VENTA`, `ENTREGA`, `INGRESO`, `AJUSTE`. |
| `sku` | string | ✅ | FK a `Variantes`. |
| `cantidad` | integer | ✅ | Unidades movidas. Siempre positivo excepto en `AJUSTE` (que puede ser negativo). |
| `vendedora_id` | string | ✅ | Origen del movimiento (quién tenía el stock). |
| `destino_id` | string | ⚠️ | Destino del stock. Solo para `ENTREGA` e `INGRESO`. Vacío en `VENTA` y `AJUSTE`. |
| `notas` | string | ❌ | Texto libre (cliente, motivo del ajuste, etc.). |
| `usuario_email` | string | ✅ | Email de quien registró el movimiento (trazabilidad). |

**Semántica por tipo de movimiento:**

| Tipo | Significado | Efecto en `Stock` |
|---|---|---|
| `VENTA` | Vendedora vende a cliente final | `Stock[sku, vendedora_id].cantidad -= cantidad` |
| `ENTREGA` | Vendedora devuelve a dueña | `Stock[sku, vendedora_id].cantidad -= cantidad`<br>`Stock[sku, destino_id].cantidad += cantidad` |
| `INGRESO` | Dueña asigna stock a vendedora | `Stock[sku, vendedora_id].cantidad -= cantidad`<br>`Stock[sku, destino_id].cantidad += cantidad` |
| `AJUSTE` | Corrección manual de conteo | `Stock[sku, vendedora_id].cantidad += cantidad` (puede ser negativo) |

## 7. Hoja `Config`

Parámetros del sistema. Tabla clave-valor simple.

| Columna | Tipo | Descripción |
|---|---|---|
| `clave` | string | PK. |
| `valor` | string | Valor (se parsea según clave). |
| `descripcion` | string | Comentario humano. |

**Claves iniciales:**

| clave | valor | descripcion |
|---|---|---|
| `moneda` | `COP` | Moneda del sistema. |
| `timezone` | `America/Bogota` | Zona horaria. |
| `version_schema` | `1.0` | Versión del schema. |
| `stock_bajo_umbral` | `2` | Unidades debajo de las cuales se alerta. |
| `permitir_stock_negativo` | `false` | Si `true`, ventas pueden dejar stock en 0 aunque no haya. |

## 8. Reglas de integridad

1. **Integridad referencial:** `Variantes.producto_id` debe existir en `Productos.producto_id`. `Stock.sku` debe existir en `Variantes.sku`. `Stock.vendedora_id` debe existir en `Vendedoras.vendedora_id`.
2. **No borrado físico:** productos, variantes y vendedoras se desactivan (`activo = FALSE`), nunca se eliminan. Preserva integridad histórica de movimientos.
3. **Stock nunca negativo** (salvo que `permitir_stock_negativo = true`).
4. **Movimientos inmutables:** una vez escritos, no se editan ni se borran. Errores se corrigen con un nuevo `AJUSTE`.
5. **Email único:** no puede haber dos vendedoras con el mismo email activo.
