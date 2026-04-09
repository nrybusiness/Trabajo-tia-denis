/**
 * Core/Config.gs
 * ----------------------------------------------------------------------------
 * Configuración central del sistema. Constantes de entorno, IDs, nombres
 * de hojas y mapeo de columnas.
 *
 * 🔧 IMPORTANTE: antes de desplegar, configura SHEET_ID con el ID de tu
 * Google Sheet (la cadena que aparece en el URL entre /d/ y /edit).
 * ----------------------------------------------------------------------------
 */

const CONFIG = {
  // ID del Google Sheet que actúa como base de datos
  SHEET_ID: 'PEGAR_AQUI_EL_ID_DEL_SHEET',

  // Zona horaria por defecto
  TIMEZONE: 'America/Bogota',

  // Moneda
  MONEDA: 'COP',

  // Versión del schema (debe coincidir con la fila en hoja Config)
  VERSION_SCHEMA: '1.0',

  // Email del superadmin por defecto (se usa si la hoja Vendedoras está vacía)
  SUPERADMIN_EMAIL_DEFAULT: 'superadmin@placeholder.com',

  // Prefijos de IDs autogenerados
  PREFIJO_PRODUCTO: 'P',
  PREFIJO_VENDEDORA: 'V',
  PREFIJO_MOVIMIENTO: 'M',

  // Cantidad de dígitos del padding numérico
  PADDING_PRODUCTO: 3,
  PADDING_VENDEDORA: 2,
  PADDING_MOVIMIENTO: 4,
};

/**
 * Nombres exactos de las hojas. Cualquier cambio debe ser reflejado
 * también en el Sheet físico.
 */
const HOJAS = {
  PRODUCTOS: 'Productos',
  VARIANTES: 'Variantes',
  VENDEDORAS: 'Vendedoras',
  STOCK: 'Stock',
  MOVIMIENTOS: 'Movimientos',
  CONFIG: 'Config',
};

/**
 * Mapeo de columnas (índice base 0) por hoja.
 * Si reordenas columnas en el Sheet, actualiza este mapeo.
 */
const COLS = {
  PRODUCTOS: {
    producto_id: 0,
    nombre: 1,
    categoria: 2,
    activo: 3,
  },
  VARIANTES: {
    sku: 0,
    producto_id: 1,
    talla: 2,
    costo: 3,
    precio_duena: 4,
    precio_oferta: 5,
    activo: 6,
  },
  VENDEDORAS: {
    vendedora_id: 0,
    nombre: 1,
    email: 2,
    rol: 3,
    activo: 4,
  },
  STOCK: {
    sku: 0,
    vendedora_id: 1,
    cantidad: 2,
  },
  MOVIMIENTOS: {
    mov_id: 0,
    fecha: 1,
    tipo: 2,
    sku: 3,
    cantidad: 4,
    vendedora_id: 5,
    destino_id: 6,
    notas: 7,
    usuario_email: 8,
  },
  CONFIG: {
    clave: 0,
    valor: 1,
    descripcion: 2,
  },
};

/**
 * Headers exactos que se escriben al instalar el sistema. El orden debe
 * coincidir con COLS de arriba.
 */
const HEADERS = {
  PRODUCTOS: ['producto_id', 'nombre', 'categoria', 'activo'],
  VARIANTES: ['sku', 'producto_id', 'talla', 'costo', 'precio_duena', 'precio_oferta', 'activo'],
  VENDEDORAS: ['vendedora_id', 'nombre', 'email', 'rol', 'activo'],
  STOCK: ['sku', 'vendedora_id', 'cantidad'],
  MOVIMIENTOS: ['mov_id', 'fecha', 'tipo', 'sku', 'cantidad', 'vendedora_id', 'destino_id', 'notas', 'usuario_email'],
  CONFIG: ['clave', 'valor', 'descripcion'],
};

/**
 * Helper: retorna el objeto Spreadsheet activo del sistema.
 * Si SHEET_ID no está configurado, intenta usar el spreadsheet activo del contenedor.
 */
function obtenerSpreadsheet() {
  if (CONFIG.SHEET_ID && CONFIG.SHEET_ID !== 'PEGAR_AQUI_EL_ID_DEL_SHEET') {
    return SpreadsheetApp.openById(CONFIG.SHEET_ID);
  }
  const activo = SpreadsheetApp.getActiveSpreadsheet();
  if (!activo) {
    throw new Error('No hay Spreadsheet configurado. Edita CONFIG.SHEET_ID en Core/Config.gs');
  }
  return activo;
}

/**
 * Helper: retorna una hoja por su nombre. Lanza error si no existe.
 */
function obtenerHoja(nombre) {
  const ss = obtenerSpreadsheet();
  const hoja = ss.getSheetByName(nombre);
  if (!hoja) {
    throw new Error('Hoja no encontrada: ' + nombre + '. Ejecuta instalarSistema() primero.');
  }
  return hoja;
}
