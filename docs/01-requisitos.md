# 01 — Requisitos del Sistema

Este documento consolida los requisitos extraídos de tres audios de la clienta (ver `docs/transcripciones/`) y validados en sesión de diseño.

## 1. Actores del sistema

| Rol | Nombre | Descripción |
|---|---|---|
| `superadmin` | Desarrollador | Acceso total. Mantiene el sistema y hace ajustes críticos. |
| `admin` | Lorena | Dueña del inventario completo. Recibe devoluciones de vendedoras. |
| `vendedora` | Nataly (N) | Tiene stock asignado bajo su responsabilidad. |
| `vendedora` | Carolina (C) | Tiene stock asignado bajo su responsabilidad. |

## 2. Requisitos funcionales

### RF-01 — Descuento automático de stock en venta
Al registrar una venta, el sistema debe descontar automáticamente la cantidad vendida del stock correspondiente al SKU y la vendedora que realiza la transacción.

**Origen:** Audio 1 — *"yo necesito que cuando yo le escriba vendido él me descuenta inmediatamente de donde como el registro de la cantidad que hay"*.

### RF-02 — Modelo vertical de inventario (SKU por talla)
Cada combinación producto + talla debe ser una fila independiente con un código único (SKU). El modelo horizontal actual (tallas como columnas) debe eliminarse.

**Origen:** Audio 1 — *"habría que poner un código por cada prenda y cada talla ejemplo leggins vitono azul rosado S/M dos, leggins vitono azul rosado L/XL"*.

### RF-03 — Discriminación de ventas por vendedora
Cada venta debe registrar explícitamente quién la realizó. El sistema debe permitir consultar totales por vendedora en cualquier momento.

**Origen:** Audio 1 — *"lo que tiene una N es lo que vendió Nataly y lo que tiene una C es lo que vendió Carolina, entonces eso también yo necesito discriminarlo"*.

### RF-04 — Registro de entregas (devoluciones a dueña)
Cuando una vendedora devuelve producto a Lorena, debe registrarse como un movimiento tipo `ENTREGA` distinto de una venta. El stock pasa de la vendedora a Lorena.

**Origen:** Audio 1 — *"en la última columna entregados son se le han devuelto a la dueña, o sea que la dueña los pide"*.

### RF-05 — Kardex individual sincronizado
Cada vendedora debe tener un kardex que refleje únicamente su stock asignado, sincronizado automáticamente con el inventario global. No debe haber duplicación manual de datos.

**Origen:** Audio 2 — *"ese es el que yo tengo como mío de manera independiente para yo registrar lo mío solamente, no lo de Carolina, no lo de Lorena"*.

### RF-06 — Listado de precios con disponibilidad
El listado de precios debe mostrar, por cada producto/variante: precio de la dueña, precio de oferta, y si hay o no hay stock en tiempo real.

**Origen:** Audio 3 — *"necesito que me salga con lo que hay y lo que no hay, que me deje ver cómo está el inventario"*.

### RF-07 — Vista rápida de venta
El listado de precios debe ser accesible rápidamente durante una venta (modo consulta), para mostrar a un cliente qué hay disponible y a qué precio.

**Origen:** Audio 3 — *"es el que yo necesitaría abrir cuando estoy vendiendo, por ejemplo, o alguien mira mi estado yo quiero tal cosa"*.

### RF-08 — Omitir columna de observaciones/conjuntos
La columna original de "Observaciones" que agrupaba conjuntos (ej. *"Conjunto jogger/Leggings $113.000"*) queda fuera del alcance de esta versión.

**Origen:** Audio 3 — *"la podemos omitir, esa fue de que yo traté de armar los conjuntos pero la podemos omitir"*.

### RF-09 — Dashboard de resultados (agregado en sesión de diseño)
El sistema debe proveer al admin un panel con: total vendido por periodo, ventas por vendedora, productos más vendidos, stock muerto, valor del inventario a costo y venta, y alertas de stock bajo.

### RF-10 — Gestión de catálogo (agregado en sesión de diseño)
El admin debe poder crear, editar y desactivar productos y variantes, así como ajustar precios de forma individual o masiva.

### RF-11 — Gestión de vendedoras (agregado en sesión de diseño)
El superadmin debe poder dar de alta, desactivar y reasignar stock entre vendedoras.

### RF-12 — Bitácora de movimientos (agregado en sesión de diseño)
Todas las transacciones (ventas, entregas, ingresos, ajustes) deben quedar registradas en una bitácora inmutable consultable y filtrable.

## 3. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | Backend: Google Sheets (petición explícita del cliente). |
| RNF-02 | Lógica: Google Apps Script con runtime V8. |
| RNF-03 | Interfaz: HTML servido por `HtmlService`, sin hosting externo. |
| RNF-04 | UX: la clienta no debe necesitar abrir el Sheet directamente. |
| RNF-05 | Cero pérdida de datos históricos durante la migración. |
| RNF-06 | Fórmulas de Sheets solo cuando Apps Script no sea viable. |
| RNF-07 | Autenticación nativa de Google (`Session.getActiveUser().getEmail()`). |
| RNF-08 | Zona horaria: `America/Bogota`. Moneda: COP. |
| RNF-09 | Código modular con Separación de Responsabilidades (SoC). |
| RNF-10 | Cada archivo con responsabilidad atómica y única. |

## 4. Hallazgos del modelo legacy (problemas resueltos)

1. **Tallas horizontales** → imposible registrar ventas por talla. Resuelto con modelo vertical (RF-02).
2. **Columna "VENDIDO" en texto libre** (`"4C - 3N"`) → imposible procesar. Resuelto con tabla `Movimientos` normalizada.
3. **Tres hojas con datos duplicados y desincronizados** → resuelto con fuente única de verdad (`Stock` + `Movimientos`).
4. **IDs inconsistentes** (faltantes, duplicados) → resuelto con reasignación limpia en migración.
5. **Precios mezclados con marcadores de talla** → resuelto separando `Variantes` (precios) de `Stock` (disponibilidad).

## 5. Fuera de alcance de esta versión

- Gestión de conjuntos/combos (RF-08 confirmado).
- Facturación electrónica / integración DIAN.
- Gestión de clientes finales.
- Fotografías de productos.
- App móvil nativa (el ADS en HTML responsivo cubre móvil).
- Multi-bodega / sucursales.
