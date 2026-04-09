# 05 — Guía de Usuario

Manual de uso del sistema ADS para administradores y vendedoras.

## Acceso al sistema

1. Abre el link del ADS que te compartió el administrador.
2. El sistema detecta automáticamente tu cuenta de Google y carga tu vista según tu rol.
3. Si ves un mensaje de "Acceso no autorizado", contacta al administrador para que registre tu email.

---

## 👤 Si eres vendedora (Nataly o Carolina)

Al entrar verás 4 opciones en el menú:

### 📦 Mi Kardex
Muestra todas las prendas que tienes bajo tu responsabilidad, con su talla y cantidad actual. Aquí puedes ver rápidamente qué te queda.

### 🛒 Registrar Venta
1. Click en "Nueva Venta".
2. Busca la prenda por nombre.
3. Elige la talla (SM / LXL / UNICA).
4. Ingresa la cantidad vendida.
5. Opcional: agrega notas (ej. nombre del cliente).
6. Click en "Guardar".

El sistema descuenta automáticamente el stock. Si no hay suficiente, te avisa.

### 📤 Registrar Entrega
Cuando le devuelves producto a Lorena:
1. Click en "Nueva Entrega".
2. Busca la prenda y la talla.
3. Ingresa la cantidad.
4. Guarda.

Esto pasa el stock de tu kardex al inventario de Lorena, sin contarlo como venta.

### 💰 Lista de Precios
Vista rápida de todas las prendas disponibles con:
- Precio oficial (de Lorena).
- Tu precio de oferta.
- Si hay o no hay stock (el tuyo).

Útil para mostrarle a un cliente qué tienes sin tener que abrir hojas de cálculo.

---

## 🎛️ Si eres admin (Lorena)

Tienes acceso a todas las funciones de vendedora **más** el panel de administración:

### 📊 Dashboard
Muestra:
- **Total vendido** en el periodo que elijas (hoy, semana, mes, rango personalizado).
- **Ventas por vendedora**: cuánto vendió cada una y cuántas unidades.
- **Top productos**: lo más vendido.
- **Stock muerto**: prendas que no se han movido.
- **Valor del inventario** a costo y a precio de venta.
- **Alertas de stock bajo**: productos que necesitan reposición.

### 🏷️ Catálogo
- Crear un producto nuevo.
- Agregar variantes por talla con sus costos y precios.
- Editar precios individuales o masivos.
- Desactivar productos descontinuados.

### 👥 Vendedoras
- Ver la lista de vendedoras activas.
- Asignar stock inicial a una vendedora.
- Ver el kardex de cualquier vendedora.

### 📋 Bitácora
Lista completa de todos los movimientos del sistema con filtros y exportación a CSV.

### ⚙️ Configuración (solo lectura para admin)
Ver parámetros del sistema.

---

## 🔧 Si eres superadmin (desarrollador)

Todo lo anterior **más**:

- Gestión de vendedoras (alta/baja, cambiar roles).
- Ajustes manuales de stock con justificación.
- Recalcular stock desde movimientos (función de emergencia).
- Configuración completa.
- Exportar/importar backups.

---

## ❓ Preguntas frecuentes

**¿Qué pasa si me equivoco al registrar una venta?**
No se puede editar ni borrar un movimiento. Contacta al superadmin para que haga un ajuste compensatorio.

**¿Puedo ver lo que vendió la otra vendedora?**
No, solo ves tu propio kardex. Lorena (admin) sí puede ver el de todas.

**¿Puedo usarlo desde el celular?**
Sí, el ADS es responsivo y funciona en móvil.
