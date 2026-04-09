/**
 * Core/Constants.gs
 * ----------------------------------------------------------------------------
 * Enums y constantes inmutables del dominio. Usar siempre estas constantes
 * en vez de strings literales en el resto del código.
 * ----------------------------------------------------------------------------
 */

/**
 * Tipos válidos de movimiento. Cada uno tiene una semántica distinta
 * en términos de cómo afecta al stock (ver docs/03-modelo-datos.md).
 */
const TIPOS_MOVIMIENTO = {
  VENTA: 'VENTA',         // Vendedora vende a cliente final → resta de su stock
  ENTREGA: 'ENTREGA',     // Vendedora devuelve a dueña → mueve stock V02→V01
  INGRESO: 'INGRESO',     // Dueña asigna stock a vendedora → mueve V01→V02
  AJUSTE: 'AJUSTE',       // Corrección manual de conteo (puede ser ±)
};

/**
 * Roles válidos del sistema. La matriz de permisos vive en AuthGuard.gs.
 */
const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  VENDEDORA: 'vendedora',
};

/**
 * Tallas válidas. Si se agregan tallas nuevas, también actualizar
 * el dropdown del frontend (Views/admin/view_catalogo.html).
 */
const TALLAS = {
  UNICA: 'U',
  SM: 'SM',
  LXL: 'LXL',
};

/**
 * Lista ordenada de tallas para iteración.
 */
const TALLAS_LISTA = [TALLAS.UNICA, TALLAS.SM, TALLAS.LXL];

/**
 * Códigos de error estándar retornados por la API.
 * Ver docs/04-api-reference.md sección "Códigos de error".
 */
const ERR = {
  NO_AUTH: 'ERR_NO_AUTH',
  FORBIDDEN: 'ERR_FORBIDDEN',
  SKU_NO_EXISTE: 'ERR_SKU_NO_EXISTE',
  PRODUCTO_NO_EXISTE: 'ERR_PRODUCTO_NO_EXISTE',
  VENDEDORA_NO_EXISTE: 'ERR_VENDEDORA_NO_EXISTE',
  STOCK_INSUFICIENTE: 'ERR_STOCK_INSUFICIENTE',
  VALIDACION: 'ERR_VALIDACION',
  DUPLICADO: 'ERR_DUPLICADO',
  INTERNO: 'ERR_INTERNO',
};

/**
 * Claves de configuración estándar.
 */
const CONFIG_KEYS = {
  MONEDA: 'moneda',
  TIMEZONE: 'timezone',
  VERSION_SCHEMA: 'version_schema',
  STOCK_BAJO_UMBRAL: 'stock_bajo_umbral',
  PERMITIR_STOCK_NEGATIVO: 'permitir_stock_negativo',
};
