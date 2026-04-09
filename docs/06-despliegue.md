# 🚀 Guía de Despliegue — INFINITY Inventory

Pasos para poner el sistema en producción desde cero.

## Requisitos previos

- Cuenta de Google (Gmail).
- Navegador web (Chrome recomendado).
- 15-20 minutos.

---

## Paso 1 — Crear el Google Sheet

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja nueva.
2. Renómbrala a `INFINITY — Inventario`.
3. Copia el **ID del Sheet** del URL. Está entre `/d/` y `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/1aBcDeFGhIjK...XYZ/edit
                                          ^^^^^^^^^^^^^^^^^^
                                          este es el ID
   ```
4. Guarda ese ID, lo necesitarás en el Paso 3.

---

## Paso 2 — Abrir el editor de Apps Script

1. En el Sheet, ve a `Extensiones → Apps Script`.
2. Se abre una nueva pestaña con el editor de código.
3. Borra el contenido de `Code.gs` que viene por defecto (lo dejaremos vacío).

---

## Paso 3 — Crear los archivos del backend

En el editor de Apps Script vas a recrear la estructura de carpetas. Apps Script
no soporta carpetas reales pero permite usar `/` en el nombre de archivo para
simularlas visualmente.

### 3.1 Crear los archivos `.gs` (24 archivos)

Para cada archivo de la siguiente lista:

1. Click en el `+` arriba a la izquierda → `Script`.
2. Nombra el archivo **exactamente** como aparece (sin la extensión `.gs`, Apps Script la agrega sola).
3. Copia el contenido del archivo correspondiente desde `apps-script/`.

**Orden de creación recomendado** (Core primero, luego abajo en la pirámide):

```
Core/Config
Core/Constants
Core/Utils
Core/Installer

Data/ProductosDAO
Data/VariantesDAO
Data/VendedorasDAO
Data/StockDAO
Data/MovimientosDAO
Data/ConfigDAO

Logic/VentasService
Logic/EntregasService
Logic/InventarioService
Logic/KardexService
Logic/PreciosService
Logic/CatalogoService
Logic/AdminVendedorasService
Logic/BitacoraService
Logic/ReportesService
Logic/ConfigService

Interface/AuthGuard
Interface/WebApp
Interface/ApiController
```

### 3.2 Crear los archivos HTML del frontend (12 archivos)

Para cada archivo HTML:

1. Click en el `+` → `HTML`.
2. Nombra el archivo (sin la extensión `.html`).
3. Copia el contenido.

**Lista:**

```
index
styles
app.js                      ← OJO: el archivo se llama "app.js" pero es HTML
operativo/view_kardex
operativo/view_ventas
operativo/view_entregas
operativo/view_precios
admin/view_dashboard
admin/view_catalogo
admin/view_vendedoras
admin/view_bitacora
admin/view_config
```

> 💡 **Tip:** Apps Script muestra los nombres con `/` ordenados alfabéticamente, lo que crea visualmente la separación de carpetas en el panel lateral.

---

## Paso 4 — Configurar el ID del Sheet

Abre `Core/Config.gs` y reemplaza:

```javascript
SHEET_ID: 'PEGAR_AQUI_EL_ID_DEL_SHEET',
```

por tu ID real:

```javascript
SHEET_ID: '1aBcDeFGhIjK...XYZ',
```

Guarda con `Ctrl+S` (o `Cmd+S`).

---

## Paso 5 — Ejecutar la instalación

1. En el desplegable de funciones (arriba), selecciona `instalarSistema`.
2. Click en ▶ **Ejecutar**.
3. **Aceptar permisos** cuando los pida:
   - "Revisar permisos"
   - Elegir tu cuenta de Google
   - Click en "Configuración avanzada" → "Ir a [nombre del proyecto] (no seguro)"
   - "Permitir"
4. Verifica en `Ver → Registros` (o el icono de logs) que diga `✓ Instalación completada`.
5. Vuelve al Sheet → deberías ver 6 hojas creadas: `Productos`, `Variantes`, `Vendedoras`, `Stock`, `Movimientos`, `Config`.

---

## Paso 6 — Cargar los datos iniciales (CSVs migrados)

Tienes los CSVs ya transformados en `data/migrated/`. Para cada uno:

1. Abre el CSV (`productos.csv`, `variantes.csv`, `stock.csv`, `movimientos.csv`).
2. Selecciona todo el contenido y cópialo.
3. En el Sheet, ve a la hoja correspondiente (ej. `Productos`).
4. Click en la celda `A2` (justo debajo del header).
5. Pega con `Ctrl+Shift+V` (pegado sin formato).
6. Si pegó todo en una sola columna: `Datos → Dividir texto en columnas → Coma`.

> ⚠️ **NO pegues encima de la fila 1**, los headers ya están creados por `instalarSistema()`.

> 💡 **Alternativa más rápida:** importa cada CSV con `Archivo → Importar → Subir → Reemplazar la hoja actual`.

**Para `vendedoras.csv` y `config.csv`:** ya están pre-cargados con datos seed por `instalarSistema()`. Solo necesitas **editar los emails de las vendedoras** con los emails reales de Google de Lorena, Nataly y Carolina (ver Paso 8).

---

## Paso 7 — Desplegar como WebApp

1. En el editor de Apps Script, click en **Implementar → Nueva implementación**.
2. Click en el icono ⚙ junto a "Seleccionar tipo" → **Aplicación web**.
3. Configurar:
   - **Descripción:** `INFINITY ADS v1.0`
   - **Ejecutar como:** `Usuario que accede` ⚠️ IMPORTANTE
   - **Quién tiene acceso:** `Cualquier usuario con cuenta de Google`
4. Click en **Implementar**.
5. **Copia el URL del WebApp** que aparece (algo como `https://script.google.com/macros/s/AKfy.../exec`).
6. Este es el link que compartirás con las vendedoras.

---

## Paso 8 — Registrar emails reales en la hoja Vendedoras

1. Abre el Sheet → hoja `Vendedoras`.
2. Reemplaza los placeholders por los emails reales:
   - `superadmin@placeholder.com` → tu email
   - `lorena@placeholder.com` → email real de Lorena
   - `nataly@placeholder.com` → email real de Nataly
   - `carolina@placeholder.com` → email real de Carolina

> ⚠️ Los emails deben ser cuentas Google válidas (Gmail, Workspace, etc).

---

## Paso 9 — Probar el sistema

1. Abre el URL del WebApp en una pestaña nueva.
2. Si entras con tu email de superadmin, deberías ver el dashboard completo.
3. Pídele a Lorena/Nataly/Caro que abran el mismo URL desde su Gmail. Cada una verá su vista según su rol.

---

## Solución de problemas

| Problema | Causa | Solución |
|---|---|---|
| "Acceso no autorizado" al abrir el WebApp | Tu email no está en la hoja `Vendedoras` o no coincide exactamente | Revisa la hoja, asegúrate de que el email esté escrito tal cual y que `activo = TRUE` |
| "Hoja no encontrada" | No se ejecutó `instalarSistema()` | Vuelve al Paso 5 |
| Errores de permisos al ejecutar | No aceptaste los permisos en el primer run | Re-ejecuta cualquier función desde el editor para que vuelva a pedir |
| El WebApp muestra "Script function not found" | El archivo `Interface/WebApp.gs` no existe o `doGet` está mal nombrado | Verifica el nombre del archivo y la función |
| Una vendedora ve más opciones de las debidas | Su rol está mal en la hoja `Vendedoras` | Cambia su rol a `vendedora` exactamente (sin mayúsculas) |
| El stock no se descuenta tras una venta | `permitir_stock_negativo` está en `true` y la cantidad excede el stock | Revisa la hoja `Config`, debería estar en `false` |
| Necesito actualizar el código | Apps Script ya no se actualiza solo | Tras editar archivos, debes hacer `Implementar → Administrar implementaciones → ✏ → Versión: nueva → Implementar` |

---

## Mantenimiento

- **Backups:** todos los miércoles, ve a `Configuración → Exportar backup JSON` (vista admin) y guarda el archivo.
- **Recalcular stock:** si alguna vez los números no cuadran, ve a `Configuración → Recalcular stock desde bitácora`. Reconstruye las cantidades a partir de la bitácora histórica de movimientos.
- **Nueva versión del código:** cada vez que actualices archivos, debes crear una nueva versión del despliegue.

---

## Próximos pasos sugeridos (post-MVP)

- Subir fotos de los productos.
- Notificaciones por email cuando algún SKU baja del umbral.
- Exportar reportes a PDF.
- Multi-idioma.
- Conectar con WhatsApp Business API para registrar ventas por chat.
