/**
 * Core/Utils.gs
 * ----------------------------------------------------------------------------
 * Funciones helper de uso transversal. Sin estado, sin dependencias externas.
 * ----------------------------------------------------------------------------
 */

/**
 * Genera un timestamp ISO 8601 en la zona horaria configurada.
 * Ejemplo: "2026-04-09T14:30:00-05:00"
 */
function nowIso() {
  const ahora = new Date();
  return Utilities.formatDate(ahora, CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Genera el siguiente ID con padding numérico para una entidad.
 *
 * @param {string} prefijo  Prefijo de la entidad (ej. 'P', 'V', 'M')
 * @param {number} numero   Número actual sin padding
 * @param {number} padding  Cantidad de dígitos del padding
 * @return {string}         ID con formato (ej. 'P001', 'V02', 'M0123')
 */
function generarId(prefijo, numero, padding) {
  const numStr = String(numero).padStart(padding, '0');
  return prefijo + numStr;
}

/**
 * Extrae el siguiente número disponible para una entidad analizando los IDs
 * existentes en una hoja.
 *
 * @param {Sheet} hoja      Hoja a analizar
 * @param {number} colId    Índice de la columna que contiene el ID
 * @param {string} prefijo  Prefijo a remover para parsear el número
 * @return {number}         Siguiente número disponible
 */
function siguienteNumeroId(hoja, colId, prefijo) {
  const ultima = hoja.getLastRow();
  if (ultima < 2) return 1;
  const ids = hoja.getRange(2, colId + 1, ultima - 1, 1).getValues();
  let max = 0;
  for (let i = 0; i < ids.length; i++) {
    const v = String(ids[i][0] || '').trim();
    if (v.startsWith(prefijo)) {
      const n = parseInt(v.substring(prefijo.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  return max + 1;
}

/**
 * Convierte un número COP a string formateado para mostrar.
 * Ejemplo: 109900 → "$ 109.900"
 */
function formatearCop(num) {
  if (num == null || num === '') return '';
  const n = Number(num);
  if (isNaN(n)) return '';
  return '$ ' + n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

/**
 * Parsea un valor a int seguro. Retorna 0 si no es válido.
 */
function toInt(valor) {
  if (valor == null || valor === '') return 0;
  const n = parseInt(valor, 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Parsea un valor a boolean. Acepta strings 'TRUE'/'FALSE', booleanos nativos, etc.
 */
function toBool(valor) {
  if (typeof valor === 'boolean') return valor;
  if (valor == null || valor === '') return false;
  const s = String(valor).trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'YES' || s === 'SI';
}

/**
 * Convierte una fila de Sheet (array) a objeto usando un mapeo de columnas.
 *
 * @param {Array} fila    Fila cruda del Sheet
 * @param {Object} mapeo  Objeto {nombre_campo: indice_columna}
 * @return {Object}       Objeto con los campos como propiedades
 */
function filaAObjeto(fila, mapeo) {
  const obj = {};
  for (const campo in mapeo) {
    obj[campo] = fila[mapeo[campo]];
  }
  return obj;
}

/**
 * Convierte un objeto a array de fila usando un mapeo de columnas.
 * Útil para escribir filas con appendRow o setValues.
 *
 * @param {Object} obj    Objeto con los datos
 * @param {Object} mapeo  Objeto {nombre_campo: indice_columna}
 * @param {number} largo  Número total de columnas en la hoja
 * @return {Array}        Array de fila listo para escribir
 */
function objetoAFila(obj, mapeo, largo) {
  const fila = new Array(largo).fill('');
  for (const campo in mapeo) {
    if (obj[campo] !== undefined && obj[campo] !== null) {
      fila[mapeo[campo]] = obj[campo];
    }
  }
  return fila;
}

/**
 * Construye una respuesta de éxito estándar para la API.
 */
function respuestaOk(data) {
  return { ok: true, data: data };
}

/**
 * Construye una respuesta de error estándar para la API.
 */
function respuestaError(mensaje, codigo) {
  return {
    ok: false,
    error: mensaje || 'Error desconocido',
    codigo: codigo || ERR.INTERNO,
  };
}

/**
 * Valida que un payload tenga todos los campos requeridos.
 * Lanza error con código ERR_VALIDACION si falta alguno.
 */
function validarCamposRequeridos(payload, camposRequeridos) {
  if (!payload || typeof payload !== 'object') {
    throw _errorValidacion('Payload vacío o inválido');
  }
  for (let i = 0; i < camposRequeridos.length; i++) {
    const c = camposRequeridos[i];
    if (payload[c] === undefined || payload[c] === null || payload[c] === '') {
      throw _errorValidacion('Campo requerido faltante: ' + c);
    }
  }
}

/**
 * @private
 */
function _errorValidacion(msg) {
  const err = new Error(msg);
  err.codigo = ERR.VALIDACION;
  return err;
}

/**
 * Compara dos fechas ISO. Retorna true si a <= b.
 */
function fechaMenorIgual(a, b) {
  return new Date(a).getTime() <= new Date(b).getTime();
}

/**
 * Logger estructurado simple. Escribe a Logger nativo de Apps Script.
 */
function log(nivel, mensaje, contexto) {
  const linea = '[' + nivel + '] ' + mensaje + (contexto ? ' | ' + JSON.stringify(contexto) : '');
  Logger.log(linea);
}
