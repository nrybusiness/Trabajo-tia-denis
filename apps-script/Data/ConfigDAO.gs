/**
 * Data/ConfigDAO.gs
 * ----------------------------------------------------------------------------
 * Capa de acceso a datos para la hoja `Config`. Tabla clave-valor simple.
 * ----------------------------------------------------------------------------
 */

const ConfigDAO = (function () {

  function _hoja() {
    return obtenerHoja(HOJAS.CONFIG);
  }

  /**
   * Lista todas las entradas de configuración.
   */
  function listar() {
    const hoja = _hoja();
    const ultima = hoja.getLastRow();
    if (ultima < 2) return [];
    const ancho = HEADERS.CONFIG.length;
    const datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
    const out = [];
    for (let i = 0; i < datos.length; i++) {
      if (!datos[i][COLS.CONFIG.clave]) continue;
      out.push(filaAObjeto(datos[i], COLS.CONFIG));
    }
    return out;
  }

  /**
   * Obtiene un valor por clave. Retorna defaultVal si no existe.
   */
  function obtener(clave, defaultVal) {
    const todos = listar();
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].clave === clave) return todos[i].valor;
    }
    return defaultVal !== undefined ? defaultVal : null;
  }

  /**
   * Establece un valor (crea o actualiza).
   */
  function establecer(clave, valor, descripcion) {
    const hoja = _hoja();
    const ultima = hoja.getLastRow();
    const ancho = HEADERS.CONFIG.length;
    if (ultima >= 2) {
      const datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
      for (let i = 0; i < datos.length; i++) {
        if (datos[i][COLS.CONFIG.clave] === clave) {
          hoja.getRange(i + 2, COLS.CONFIG.valor + 1).setValue(valor);
          if (descripcion !== undefined) {
            hoja.getRange(i + 2, COLS.CONFIG.descripcion + 1).setValue(descripcion);
          }
          return;
        }
      }
    }
    // No existía, crear
    hoja.appendRow([clave, valor, descripcion || '']);
  }

  return {
    listar: listar,
    obtener: obtener,
    establecer: establecer,
  };
})();
