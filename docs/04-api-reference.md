# 04 — API Reference

Endpoints expuestos por `ApiController.gs` y consumidos desde el frontend ADS vía `google.script.run`.

## Convenciones

- Todos los endpoints retornan un objeto de forma estándar:

```javascript
// Éxito
{ ok: true, data: <resultado> }

// Error
{ ok: false, error: "mensaje humano", codigo: "ERR_CODE" }
```

- Todos los endpoints (excepto `apiObtenerSesion`) aplican `AuthGuard.requireRol([...])` antes de ejecutar.
- Los parámetros siempre viajan como un único objeto (`payload`).

---

## 1. Sesión y auth

### `apiObtenerSesion()`
Retorna el usuario actual autenticado. No requiere rol previo.

**Parámetros:** ninguno.

**Respuesta:**
```javascript
{
  ok: true,
  data: {
    vendedora_id: "V02",
    nombre: "Nataly",
    email: "nataly@...",
    rol: "vendedora"
  }
}
```

---

## 2. Inventario y kardex

### `apiObtenerInventarioGlobal()`
Lista el inventario total con stock agregado por SKU.
**Roles permitidos:** `superadmin`, `admin`.

### `apiObtenerKardex(payload)`
Lista el kardex de una vendedora específica.
**Roles permitidos:** `superadmin`, `admin`, `vendedora` (solo su propio kardex).
**Payload:** `{ vendedora_id: "V02" }`

### `apiObtenerPrecios()`
Lista de precios con disponibilidad en tiempo real.
**Roles permitidos:** todos los autenticados.

---

## 3. Transacciones

### `apiRegistrarVenta(payload)`
Registra una venta y descuenta stock.
**Roles permitidos:** `superadmin`, `admin`, `vendedora`.
**Payload:**
```javascript
{
  sku: "P001-SM",
  cantidad: 1,
  vendedora_id: "V02",
  notas: "Cliente María"
}
```

### `apiRegistrarEntrega(payload)`
Registra devolución de vendedora a dueña.
**Roles permitidos:** `superadmin`, `admin`, `vendedora`.
**Payload:**
```javascript
{
  sku: "P001-SM",
  cantidad: 1,
  vendedora_id: "V02",
  destino_id: "V01",
  notas: "Devolución semanal"
}
```

### `apiRegistrarIngreso(payload)`
Dueña/admin asigna stock a una vendedora.
**Roles permitidos:** `superadmin`, `admin`.
**Payload:**
```javascript
{
  sku: "P001-SM",
  cantidad: 5,
  vendedora_id: "V01",
  destino_id: "V02",
  notas: "Asignación inicial"
}
```

### `apiAjustarStock(payload)`
Corrección manual de stock (solo superadmin).
**Roles permitidos:** `superadmin`.
**Payload:**
```javascript
{
  sku: "P001-SM",
  vendedora_id: "V02",
  delta: -1,
  notas: "Corrección conteo físico"
}
```

---

## 4. Catálogo (admin)

### `apiCrearProducto(payload)`
**Roles:** `superadmin`, `admin`.
**Payload:** `{ nombre, categoria }`

### `apiEditarProducto(payload)`
**Roles:** `superadmin`, `admin`.
**Payload:** `{ producto_id, nombre?, categoria?, activo? }`

### `apiCrearVariante(payload)`
**Roles:** `superadmin`, `admin`.
**Payload:** `{ producto_id, talla, costo, precio_duena, precio_oferta }`

### `apiEditarVariante(payload)`
**Roles:** `superadmin`, `admin`.
**Payload:** `{ sku, costo?, precio_duena?, precio_oferta?, activo? }`

### `apiListarProductos()`
**Roles:** todos los autenticados.

### `apiListarVariantes(payload)`
**Roles:** todos los autenticados.
**Payload:** `{ producto_id? }` (opcional, filtra)

---

## 5. Gestión de vendedoras (superadmin)

### `apiListarVendedoras()`
**Roles:** `superadmin`, `admin`.

### `apiCrearVendedora(payload)`
**Roles:** `superadmin`.
**Payload:** `{ nombre, email, rol }`

### `apiEditarVendedora(payload)`
**Roles:** `superadmin`.
**Payload:** `{ vendedora_id, nombre?, email?, rol?, activo? }`

---

## 6. Reportes y dashboard

### `apiDashboardResumen(payload)`
Retorna KPIs del dashboard.
**Roles:** `superadmin`, `admin`.
**Payload:** `{ desde: "2026-04-01", hasta: "2026-04-09" }`

### `apiReporteVentas(payload)`
Lista detallada de ventas.
**Roles:** `superadmin`, `admin`.
**Payload:** `{ desde, hasta, vendedora_id? }`

---

## 7. Bitácora

### `apiBitacoraListar(payload)`
**Roles:** `superadmin`, `admin`.
**Payload:** `{ desde?, hasta?, tipo?, sku?, vendedora_id?, limite? }`

---

## 8. Configuración

### `apiConfigObtener()`
**Roles:** todos los autenticados (lectura).

### `apiConfigActualizar(payload)`
**Roles:** `superadmin`.
**Payload:** `{ clave, valor }`

---

## 9. Utilidades (superadmin)

### `apiRecalcularStock()`
Reconstruye la hoja `Stock` desde `Movimientos`.
**Roles:** `superadmin`.

### `apiExportarBackup()`
Exporta snapshot completo como JSON.
**Roles:** `superadmin`, `admin`.

---

## Códigos de error estándar

| Código | Significado |
|---|---|
| `ERR_NO_AUTH` | Usuario no autenticado. |
| `ERR_FORBIDDEN` | Usuario autenticado pero sin rol suficiente. |
| `ERR_SKU_NO_EXISTE` | SKU inválido. |
| `ERR_STOCK_INSUFICIENTE` | No hay stock suficiente para la operación. |
| `ERR_VALIDACION` | Payload mal formado. |
| `ERR_INTERNO` | Error inesperado. |
