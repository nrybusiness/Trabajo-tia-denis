# Script de Migración

Transforma los CSVs legacy del inventario INFINITY al nuevo schema relacional.

## Uso

```bash
python3 scripts/migracion/migrar_csv.py
```

**Input:** archivos en `data/raw/`
- `INV_COMPLETO.csv`
- `Precios.csv`
- `kardex_Naty.csv`

**Output:** archivos en `data/migrated/`
- `productos.csv` — catálogo maestro
- `variantes.csv` — SKUs con costos y precios
- `vendedoras.csv` — usuarias seed
- `stock.csv` — stock por SKU/vendedora
- `movimientos.csv` — bitácora histórica derivada
- `config.csv` — parámetros del sistema

## Reglas de transformación

1. **Cada producto único** del CSV legacy → 1 fila en `productos.csv` con ID `P###` autogenerado.
2. **Cada combinación producto+talla** → 1 variante en `variantes.csv` con SKU `{prod_id}-{talla}`.
3. **Tallas:** `S/M` → `SM`, `L/XL` → `LXL`, `UNICA` → `U`.
4. **Precios:** se cruzan con `Precios.csv` para obtener `precio_oferta`. Si no hay match, `precio_oferta = precio_duena`.
5. **Stock inicial:**
   - Todo el stock arranca asignado a Lorena (`V01`).
   - Si el SKU aparece en `kardex_Naty.csv`, esa cantidad se transfiere a Nataly (`V02`) y se genera un movimiento `INGRESO`.
6. **Ventas históricas:** la columna `VENDIDO` del legacy (ej. `"4C - 3N"`) se parsea y se generan movimientos `VENTA` históricos con fecha `2026-01-01`.

## Limitaciones conocidas

- **No se conserva la fecha real** de las ventas históricas (no existe en el CSV legacy). Todas se marcan como `2026-01-01`.
- **No se distribuye por talla** las ventas históricas: se asignan a la primera talla del producto. Para ajustes finos, hacer movimientos `AJUSTE` después de la importación.
- **Carolina (`V03`)** arranca con stock 0 porque el legacy solo tenía Kardex de Nataly. El admin debe asignarle stock manualmente desde el ADS después de la migración.
- **Productos legacy duplicados** (ej. dos "23. Holgada Tul" o dos "33") se deduplican por nombre normalizado.

## Cómo cargar los CSVs migrados al Sheet

1. Crear un nuevo Google Sheet.
2. Crear 6 hojas: `Productos`, `Variantes`, `Vendedoras`, `Stock`, `Movimientos`, `Config`.
3. En cada hoja, `Archivo → Importar → Subir → CSV → Reemplazar la hoja actual`.
4. **Alternativa automática:** ejecutar `instalarSistema()` desde el editor de Apps Script (la función crea las hojas e importa los CSVs si están en Drive).
