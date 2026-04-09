#!/usr/bin/env python3
"""
Script de migración: transforma los CSVs legacy de Inventario_INFINITY
al nuevo schema relacional (Productos, Variantes, Stock, Vendedoras).

Uso:
    python3 migrar_csv.py

Input:  data/raw/*.csv
Output: data/migrated/*.csv

Reglas de transformación:
- Cada producto del INV_COMPLETO se convierte en una fila en productos.csv
- Cada combinación producto+talla con cantidad > 0 (o marcada con 'x') se convierte en una variante
- Para cada variante se generan filas de stock por vendedora
- Las vendedoras seed son: Lorena (admin), Nataly (vendedora), Carolina (vendedora)
"""

import csv
import re
import os
from pathlib import Path

# Rutas
ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw"
OUT_DIR = ROOT / "data" / "migrated"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Vendedoras seed
VENDEDORAS = [
    {"vendedora_id": "V00", "nombre": "Desarrollador", "email": "superadmin@placeholder.com", "rol": "superadmin", "activo": "TRUE"},
    {"vendedora_id": "V01", "nombre": "Lorena", "email": "lorena@placeholder.com", "rol": "admin", "activo": "TRUE"},
    {"vendedora_id": "V02", "nombre": "Nataly", "email": "nataly@placeholder.com", "rol": "vendedora", "activo": "TRUE"},
    {"vendedora_id": "V03", "nombre": "Carolina", "email": "carolina@placeholder.com", "rol": "vendedora", "activo": "TRUE"},
]


def parse_money(s):
    """Convierte '$ 47.389,00' o '109.900' a int 47389 / 109900."""
    if not s or s.strip() == "":
        return 0
    s = s.replace("$", "").replace(" ", "").strip()
    # Caso "47.389,00" → quitar . y reemplazar , por .
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
        try:
            return int(float(s))
        except ValueError:
            return 0
    # Caso "109.900" sin decimales → punto es separador de miles
    s = s.replace(".", "")
    try:
        return int(s)
    except ValueError:
        return 0


def parse_qty(s):
    """Convierte '2', 'x', '' a int. 'x' o vacío = 0."""
    if not s or s.strip().lower() == "x":
        return 0
    try:
        return int(s.strip())
    except ValueError:
        return 0


def is_unica(unica_col, sm_col, lxl_col):
    """Determina si el producto es talla única."""
    return unica_col.strip().lower() != "x" and unica_col.strip() != ""


def slug_categoria(nombre):
    """Heurística para asignar categoría a partir del nombre."""
    n = nombre.lower()
    if "leggin" in n:
        return "Leggins"
    if "hoodie" in n or "buso" in n:
        return "Hoodies"
    if "top" in n:
        return "Tops"
    if "short" in n:
        return "Shorts"
    if "biker" in n:
        return "Bikers"
    if "falda" in n:
        return "Faldas"
    if "jogger" in n:
        return "Joggers"
    if "camiseta" in n or "sisa" in n or "holgada" in n:
        return "Camisetas"
    if "body" in n:
        return "Bodies"
    return "Otros"


def limpiar_nombre(raw):
    """Quita el prefijo numérico tipo '1. ' del nombre."""
    return re.sub(r"^\s*\d+\.\s*", "", raw).strip()


def parse_vendido(vendido_str):
    """
    Parsea la columna 'VENDIDO' del CSV legacy.
    Ejemplos: '2N', '1C', '4C - 3N', '2C 1N', '4C - 3N '
    Retorna dict {V02: int, V03: int} (Nataly y Carolina).
    """
    out = {"V02": 0, "V03": 0}
    if not vendido_str:
        return out
    s = vendido_str.strip()
    # Buscar patrones tipo "<num><N|C>"
    matches = re.findall(r"(\d+)\s*([NC])", s)
    for num, letra in matches:
        if letra == "N":
            out["V02"] += int(num)
        elif letra == "C":
            out["V03"] += int(num)
    return out


def main():
    print("=" * 60)
    print("MIGRACIÓN INFINITY INVENTORY")
    print("=" * 60)

    # Leer INV_COMPLETO.csv
    inv_path = RAW_DIR / "INV_COMPLETO.csv"
    productos = []
    variantes = []
    stock = []
    movimientos_iniciales = []

    producto_counter = 0
    mov_counter = 0
    nombres_vistos = {}  # nombre normalizado -> producto_id (para deduplicar)

    with open(inv_path, encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)  # header
        next(reader)  # fila vacía

        for row in reader:
            if len(row) < 9:
                continue
            nombre_raw = row[1]
            if not nombre_raw or not nombre_raw.strip():
                continue

            nombre = limpiar_nombre(nombre_raw)
            nombre_key = nombre.lower().strip()

            # Deduplicar por nombre
            if nombre_key in nombres_vistos:
                producto_id = nombres_vistos[nombre_key]
            else:
                producto_counter += 1
                producto_id = f"P{producto_counter:03d}"
                nombres_vistos[nombre_key] = producto_id
                productos.append({
                    "producto_id": producto_id,
                    "nombre": nombre,
                    "categoria": slug_categoria(nombre),
                    "activo": "TRUE"
                })

            unica_col = row[2]
            sm_col = row[3]
            lxl_col = row[4]
            costo = parse_money(row[5])
            precio_duena = parse_money(row[6])
            vendido_str = row[7] if len(row) > 7 else ""

            # Determinar tallas
            tallas = []
            if is_unica(unica_col, sm_col, lxl_col):
                # Producto talla única — la columna UNICA tiene la cantidad
                cantidad_unica = parse_qty(unica_col)
                tallas.append(("U", cantidad_unica))
            else:
                cantidad_sm = parse_qty(sm_col)
                cantidad_lxl = parse_qty(lxl_col)
                if cantidad_sm > 0 or sm_col.strip() != "x":
                    tallas.append(("SM", cantidad_sm))
                if cantidad_lxl > 0 or lxl_col.strip() != "x":
                    tallas.append(("LXL", cantidad_lxl))

            # Crear variantes y stock
            ventas_dict = parse_vendido(vendido_str)
            ventas_total = sum(ventas_dict.values())

            for talla, cantidad_actual in tallas:
                sku = f"{producto_id}-{talla}"
                # Variante (precio_oferta inicial = precio_duena, se actualizará desde Precios.csv)
                variantes.append({
                    "sku": sku,
                    "producto_id": producto_id,
                    "talla": talla,
                    "costo": costo,
                    "precio_duena": precio_duena,
                    "precio_oferta": precio_duena,
                    "activo": "TRUE"
                })

                # Stock: el inventario actual representa lo que está en mano de las vendedoras
                # Asumimos que el stock está distribuido y no hay registro detallado por vendedora
                # Solución pragmática: todo el stock actual se asigna a Lorena (V01) inicialmente,
                # y luego se generan movimientos INGRESO para reflejar lo ya asignado a Naty/Caro.
                stock.append({
                    "sku": sku,
                    "vendedora_id": "V01",
                    "cantidad": cantidad_actual
                })
                stock.append({"sku": sku, "vendedora_id": "V02", "cantidad": 0})
                stock.append({"sku": sku, "vendedora_id": "V03", "cantidad": 0})

                # Generar movimientos VENTA históricos derivados del campo "VENDIDO"
                # (no podemos saber qué talla se vendió, así que distribuimos al primer SKU del producto)
                # Solo lo hacemos en la primera variante de cada producto para no duplicar
                if talla == tallas[0][0] and ventas_total > 0:
                    for v_id, n in ventas_dict.items():
                        if n > 0:
                            mov_counter += 1
                            movimientos_iniciales.append({
                                "mov_id": f"M{mov_counter:04d}",
                                "fecha": "2026-01-01T00:00:00-05:00",
                                "tipo": "VENTA",
                                "sku": sku,
                                "cantidad": n,
                                "vendedora_id": v_id,
                                "destino_id": "",
                                "notas": "Migración histórica desde CSV legacy",
                                "usuario_email": "superadmin@placeholder.com"
                            })

    # Cruzar con Precios.csv para obtener precio_oferta real
    precios_path = RAW_DIR / "Precios.csv"
    precios_oferta = {}  # nombre_lower -> precio_oferta
    with open(precios_path, encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)  # header 1
        next(reader)  # header 2
        next(reader)  # fila vacía
        for row in reader:
            if len(row) < 7 or not row[1].strip():
                continue
            nombre = row[1].strip().lower()
            precio_of = parse_money(row[6])
            if precio_of > 0:
                precios_oferta[nombre] = precio_of

    # Aplicar precio_oferta a las variantes
    nombre_a_id = {v.lower(): k for k, v in [(p["producto_id"], p["nombre"]) for p in productos]}
    for v in variantes:
        prod = next((p for p in productos if p["producto_id"] == v["producto_id"]), None)
        if prod:
            key = prod["nombre"].lower().strip()
            if key in precios_oferta:
                v["precio_oferta"] = precios_oferta[key]

    # Cruzar con kardex_Naty.csv para inferir cuánto tiene Nataly
    kardex_path = RAW_DIR / "kardex_Naty.csv"
    kardex_naty = {}  # (nombre_lower, talla) -> cantidad
    with open(kardex_path, encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)  # header 1
        next(reader)  # header 2
        next(reader)  # vacía
        for row in reader:
            if len(row) < 7 or not row[1].strip():
                continue
            nombre = row[1].strip().lower()
            unica_col = row[2]
            sm_col = row[3]
            lxl_col = row[4]
            if is_unica(unica_col, sm_col, lxl_col):
                kardex_naty[(nombre, "U")] = parse_qty(unica_col)
            else:
                kardex_naty[(nombre, "SM")] = parse_qty(sm_col)
                kardex_naty[(nombre, "LXL")] = parse_qty(lxl_col)

    # Reasignar stock: lo que está en kardex_Naty va a V02, el resto se queda en V01
    productos_por_id = {p["producto_id"]: p for p in productos}
    for s in stock:
        if s["vendedora_id"] != "V01":
            continue
        # Buscar en kardex
        prod_id = s["sku"].split("-")[0]
        talla = s["sku"].split("-")[1]
        prod = productos_por_id.get(prod_id)
        if not prod:
            continue
        nombre_key = prod["nombre"].lower().strip()
        cantidad_naty = kardex_naty.get((nombre_key, talla), 0)
        if cantidad_naty > 0 and cantidad_naty <= s["cantidad"]:
            # Mover de V01 a V02
            s["cantidad"] -= cantidad_naty
            for s2 in stock:
                if s2["sku"] == s["sku"] and s2["vendedora_id"] == "V02":
                    s2["cantidad"] = cantidad_naty
                    break
            # Generar movimiento INGRESO
            mov_counter += 1
            movimientos_iniciales.append({
                "mov_id": f"M{mov_counter:04d}",
                "fecha": "2026-01-01T00:00:00-05:00",
                "tipo": "INGRESO",
                "sku": s["sku"],
                "cantidad": cantidad_naty,
                "vendedora_id": "V01",
                "destino_id": "V02",
                "notas": "Migración: stock asignado a Nataly según kardex",
                "usuario_email": "superadmin@placeholder.com"
            })

    # ==== ESCRIBIR ARCHIVOS ====

    def escribir_csv(nombre_archivo, fieldnames, filas):
        path = OUT_DIR / nombre_archivo
        with open(path, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(filas)
        print(f"  ✓ {nombre_archivo}: {len(filas)} filas")

    print("\nGenerando CSVs migrados:")

    escribir_csv("productos.csv",
                 ["producto_id", "nombre", "categoria", "activo"],
                 productos)

    escribir_csv("variantes.csv",
                 ["sku", "producto_id", "talla", "costo", "precio_duena", "precio_oferta", "activo"],
                 variantes)

    escribir_csv("vendedoras.csv",
                 ["vendedora_id", "nombre", "email", "rol", "activo"],
                 VENDEDORAS)

    escribir_csv("stock.csv",
                 ["sku", "vendedora_id", "cantidad"],
                 stock)

    escribir_csv("movimientos.csv",
                 ["mov_id", "fecha", "tipo", "sku", "cantidad", "vendedora_id", "destino_id", "notas", "usuario_email"],
                 movimientos_iniciales)

    config = [
        {"clave": "moneda", "valor": "COP", "descripcion": "Moneda del sistema"},
        {"clave": "timezone", "valor": "America/Bogota", "descripcion": "Zona horaria"},
        {"clave": "version_schema", "valor": "1.0", "descripcion": "Versión del schema"},
        {"clave": "stock_bajo_umbral", "valor": "2", "descripcion": "Unidades para alerta de stock bajo"},
        {"clave": "permitir_stock_negativo", "valor": "false", "descripcion": "Si true, permite ventas sin stock"},
    ]
    escribir_csv("config.csv",
                 ["clave", "valor", "descripcion"],
                 config)

    print(f"\n{'=' * 60}")
    print(f"Migración completada. Archivos en: {OUT_DIR}")
    print(f"{'=' * 60}")
    print(f"  Productos:    {len(productos)}")
    print(f"  Variantes:    {len(variantes)}")
    print(f"  Stock rows:   {len(stock)}")
    print(f"  Movimientos:  {len(movimientos_iniciales)}")
    print(f"  Vendedoras:   {len(VENDEDORAS)}")


if __name__ == "__main__":
    main()
