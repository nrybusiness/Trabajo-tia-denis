/**
 * Core/Constants.gs
 * -----------------------------------------------------------------------------
 * Enumeraciones y constantes de dominio. Cualquier valor con un conjunto
 * cerrado de opciones vive aquí.
 * -----------------------------------------------------------------------------
 */

/**
 * Tipos de movimiento de inventario.
 * VENTA: salida definitiva al cliente final.
 * ENTREGA: devolución de vendedora a dueña (interna entre actores).
 * INGRESO: entrada nueva al sistema (compra, producción).
 * AJUSTE: corrección manual (inventario físico, error de conteo).
 */
const TIPO_MOVIMIENTO = Object.freeze({
  VENTA: 'VENTA',
  ENTREGA: 'ENTREGA',
  INGRESO: 'INGRESO',
  AJUSTE: 'AJUSTE'
});

const TIPOS_MOVIMIENTO_VALIDOS = Object.freeze([
  TIPO_MOVIMIENTO.VENTA,
  TIPO_MOVIMIENTO.ENTREGA,
  TIPO_MOVIMIENTO.INGRESO,
  TIPO_MOVIMIENTO.AJUSTE
]);

/**
 * Roles de vendedora.
 * DUEÑA: propietaria del inventario. Puede recibir entregas y también vender.
 * VENDEDORA: vendedora regular con stock asignado.
 */
const ROL = Object.freeze({
  DUEÑA: 'dueña',
  VENDEDORA: 'vendedora'
});

const ROLES_VALIDOS = Object.freeze([ROL.DUEÑA, ROL.VENDEDORA]);

/**
 * Tallas válidas del catálogo.
 */
const TALLA = Object.freeze({
  UNICA: 'UNICA',
  SM: 'S/M',
  LXL: 'L/XL'
});

const TALLAS_VALIDAS = Object.freeze([TALLA.UNICA, TALLA.SM, TALLA.LXL]);

/**
 * Mapeo de talla a sufijo de SKU (para evitar '/' en identificadores).
 * UNICA  → U
 * S/M    → SM
 * L/XL   → LXL
 */
const TALLA_SUFIJO_SKU = Object.freeze({
  'UNICA': 'U',
  'S/M': 'SM',
  'L/XL': 'LXL'
});

/**
 * Códigos de error estandarizados retornados por la capa Logic al frontend.
 * El ADS puede traducirlos a mensajes amigables para el usuario.
 */
const ERROR_CODE = Object.freeze({
  AUTH_REQUERIDA: 'AUTH_REQUERIDA',
  AUTH_INVALIDA: 'AUTH_INVALIDA',
  AUTH_EXPIRADA: 'AUTH_EXPIRADA',
  PERMISO_DENEGADO: 'PERMISO_DENEGADO',
  VALIDACION: 'VALIDACION',
  NO_ENCONTRADO: 'NO_ENCONTRADO',
  STOCK_INSUFICIENTE: 'STOCK_INSUFICIENTE',
  DUPLICADO: 'DUPLICADO',
  INTEGRIDAD: 'INTEGRIDAD',
  INTERNO: 'INTERNO'
});

/**
 * Prefijos usados para generar IDs.
 */
const PREFIJO_ID = Object.freeze({
  PRODUCTO: 'P',
  VENDEDORA: 'V',
  MOVIMIENTO: 'M'
});
