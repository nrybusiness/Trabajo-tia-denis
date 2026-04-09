# Arquitectura del Sistema

## 1. Visión general

El sistema sigue una arquitectura de **4 capas** con separación estricta de
responsabilidades, desplegada íntegramente dentro del ecosistema Google
Workspace para minimizar costos y mantenimiento.

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    NAVEGADOR (cliente)                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ADS — HTML + CSS + JS                            │  │
│  │  (login, vistas, formularios)                     │  │
│  └──────────────────┬────────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────┘
                      │ google.script.run
┌─────────────────────▼───────────────────────────────────┐
│                GOOGLE APPS SCRIPT (servidor)            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Interface/  — WebApp.gs, ApiController.gs        │  │
│  │  Entrada HTTP, validación de payload, auth gate   │  │
│  └──────────────────┬────────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼────────────────────────────────┐  │
│  │  Logic/Services  — reglas de negocio              │  │
│  │  InventarioService, KardexService, VentasService, │  │
│  │  EntregasService, PreciosService, VendedorasSvc,  │  │
│  │  AuthService, ReportesService                     │  │
│  └──────────────────┬────────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼────────────────────────────────┐  │
│  │  Data/DAO  — acceso puro a Sheets                 │  │
│  │  ProductosDAO, VariantesDAO, StockDAO,            │  │
│  │  VendedorasDAO, MovimientosDAO, SesionesDAO       │  │
│  └──────────────────┬────────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼────────────────────────────────┐  │
│  │  Core  — Config, Constants, Utils                 │  │
│  └──────────────────┬────────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────┘
                      │ SpreadsheetApp
┌─────────────────────▼───────────────────────────────────┐
│                  GOOGLE SHEETS (BD)                     │
│  Productos │ Variantes │ Vendedoras │ Stock │           │
│  Movimientos │ Sesiones │ Config                        │
└─────────────────────────────────────────────────────────┘
\`\`\`

## 2. Reglas de la arquitectura

### 2.1 Dirección de las dependencias
Las dependencias solo fluyen hacia abajo. **Nunca** una capa inferior importa
una superior.

- `Views` → `Interface` → `Logic` → `Data` → `Core`
- `Core` no depende de nadie.

### 2.2 Responsabilidades por capa

| Capa | Hace | No hace |
|------|------|---------|
| **Core** | Configuración, constantes, utilidades puras. | No toca Sheets ni lógica de negocio. |
| **Data** | Leer/escribir hojas de Sheets. CRUD atómico. | No valida reglas de negocio. |
| **Logic** | Reglas de negocio, validaciones, orquestación. | No toca Sheets directamente, solo vía DAOs. |
| **Interface** | Recibir llamadas del frontend, auth gate, serializar respuestas. | No implementa reglas de negocio. |
| **Views** | UI, eventos, renderizado, formularios. | No contiene reglas de negocio ni cálculos de stock. |

### 2.3 Inmutabilidad de movimientos
La tabla `Movimientos` es **append-only**. Nunca se edita una fila existente.
Los errores se corrigen mediante movimientos de tipo `AJUSTE`.

### 2.4 Fuente única de verdad
El stock actual vive en la tabla `Stock`, pero es **derivable** al 100% desde
`Movimientos`. Existe un método `StockService.recalcular()` que reconstruye
`Stock` desde cero a partir de `Movimientos` en caso de inconsistencia.

## 3. Flujo de una venta (ejemplo)

\`\`\`
1. Usuario en ADS → click "Registrar venta"
2. view_ventas.html → app.js.html captura datos del formulario
3. google.script.run.registrarVenta({sku, cantidad, vendedora_id, token})
4. ApiController.registrarVenta()
     ├─ AuthService.validarToken(token) → OK
     └─ VentasService.registrar(sku, cantidad, vendedora_id)
          ├─ StockDAO.obtener(sku, vendedora_id) → verifica disponibilidad
          ├─ MovimientosDAO.insertar({tipo: VENTA, ...})
          └─ StockDAO.decrementar(sku, vendedora_id, cantidad)
5. Respuesta JSON → callback en cliente
6. app.js.html refresca la vista
\`\`\`

## 4. Flujo de autenticación

\`\`\`
1. Usuario ingresa usuario + contraseña en login.html
2. google.script.run.login({usuario, password})
3. ApiController.login()
     └─ AuthService.login(usuario, password)
          ├─ VendedorasDAO.buscarPorUsuario(usuario)
          ├─ Utils.verificarPassword(password, hash, salt)
          ├─ Utils.generarToken() → UUID
          └─ SesionesDAO.crear({token, vendedora_id, expira_en})
4. Retorna {token, vendedora} al cliente
5. Cliente guarda token en sessionStorage
6. Cada llamada posterior incluye el token
7. ApiController.* valida el token antes de ejecutar
\`\`\`

## 5. Decisiones de diseño relevantes

| # | Decisión | Razón |
|---|----------|-------|
| 1 | Sheets como BD en vez de Firestore | Petición explícita del cliente, gratis, auditable manualmente. |
| 2 | SKU por variante (producto+talla) | Único modo de descontar ventas por talla (RF-02). |
| 3 | Stock derivable de Movimientos | Garantía de integridad y auditoría completa. |
| 4 | Auth con tokens en hoja `Sesiones` | Persistencia entre reloads, `CacheService` tiene TTL máx 6h. |
| 5 | Sin fórmulas de celda | Petición del cliente. Toda la lógica vive en Apps Script. |
| 6 | Frontend servido por HtmlService | Cero hosting externo, mismo proyecto, mismo despliegue. |
