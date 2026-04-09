# Requisitos del Sistema

## 1. Contexto

La clienta (Lorena) es dueña de un inventario de ropa deportiva femenina que
distribuye entre vendedoras asociadas. Cada vendedora recibe una parte del
inventario y responde por él. Actualmente la gestión se hace en un único
archivo Excel con tres pestañas desincronizadas, lo que genera errores de
conteo, imposibilidad de rastrear ventas por vendedora y mezcla de datos
en campos de texto libre.

## 2. Actores

| Rol | Nombre | Descripción |
|-----|--------|-------------|
| Dueña | Lorena | Propietaria del inventario global. Puede vender si lo necesita. |
| Vendedora | Nataly (N) | Vendedora con stock asignado bajo su responsabilidad. |
| Vendedora | Carolina (C) | Vendedora con stock asignado bajo su responsabilidad. |

El sistema debe soportar la creación, edición y desactivación de vendedoras
adicionales sin cambios de código.

## 3. Requisitos Funcionales

### RF-01 — Descuento automático de stock
Al registrar una venta desde el ADS, el stock de la variante correspondiente
debe descontarse automáticamente del kardex de la vendedora que vendió.

### RF-02 — Modelo vertical por talla
Cada combinación `producto + talla` debe existir como fila independiente con
un SKU único. Las tallas válidas son: `UNICA`, `S/M`, `L/XL`.

### RF-03 — Discriminación de ventas por vendedora
Cada movimiento de venta debe registrar explícitamente quién vendió.
Las consultas de reportes deben poder filtrar y agrupar por vendedora.

### RF-04 — Registro de entregas (devoluciones a la dueña)
Cuando una vendedora devuelve mercancía a la dueña, debe registrarse como
un movimiento de tipo `ENTREGA`, restando del kardex de la vendedora y
sumando al de la dueña.

### RF-05 — Kardex individual
Cada vendedora debe tener una vista de kardex que muestre exclusivamente
su stock asignado. Esta vista se deriva en tiempo real del stock global.

### RF-06 — Listado de precios con disponibilidad
Debe existir una vista de listado de precios que muestre:
- Precio de la dueña (precio oficial).
- Precio de oferta (precio al cliente final).
- Disponibilidad actual (hay / no hay) derivada del stock.

### RF-07 — Modo venta rápida
El listado de precios debe ser accesible rápidamente durante una venta,
con búsqueda/filtro y estado visual claro de disponibilidad.

### RF-08 — Gestión de vendedoras
El ADS debe permitir crear, editar y desactivar vendedoras.

### RF-09 — Autenticación
El ADS debe requerir login con usuario y contraseña. Cada vendedora tiene
su propio acceso. La sesión se mantiene por tokens con expiración.

### RF-10 — Bitácora inmutable
Todos los movimientos de inventario deben quedar registrados en una tabla
de bitácora que nunca se borra, para auditoría y recálculo de stock.

## 4. Requisitos No Funcionales

| ID | Requisito |
|----|-----------|
| RNF-01 | Backend sobre Google Sheets. |
| RNF-02 | Lógica en Google Apps Script. |
| RNF-03 | Frontend ADS servido por `HtmlService` del mismo Apps Script. |
| RNF-04 | La clienta no debe necesitar abrir el Sheet manualmente. |
| RNF-05 | Cero pérdida de datos históricos al migrar desde CSVs. |
| RNF-06 | Preferencia por Apps Script sobre fórmulas de celda. |
| RNF-07 | Moneda en COP, zona horaria `America/Bogota`. |
| RNF-08 | Contraseñas nunca almacenadas en texto plano. |

## 5. Fuera de alcance (omisiones explícitas)

- Columna de "Observaciones/Conjuntos" del Excel original (RF confirmada por
  la clienta en audio 3).
- Integraciones con pasarelas de pago.
- Facturación electrónica.
- App móvil nativa (el ADS web funciona en móvil).
