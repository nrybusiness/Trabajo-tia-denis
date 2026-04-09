/**
 * Data/VendedorasDAO.gs
 * ----------------------------------------------------------------------------
 * Capa de acceso a datos para la hoja `Vendedoras`. También sirve como
 * tabla de autenticación (lookup por email).
 * ----------------------------------------------------------------------------
 */

const VendedorasDAO = (function () {

  function _hoja() {
    return obtenerHoja(HOJAS.VENDEDORAS);
  }

  function _parsearFila(fila) {
    const obj = filaAObjeto(fila, COLS.VENDEDORAS);
    obj.activo = toBool(obj.activo);
    obj.email = String(obj.email || '').trim().toLowerCase();
    return obj;
  }

  /**
   * Lista todas las vendedoras.
   */
  function listar(soloActivas) {
    const hoja = _hoja();
    const ultima = hoja.getLastRow();
    if (ultima < 2) return [];
    const ancho = HEADERS.VENDEDORAS.length;
    const datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
    const out = [];
    for (let i = 0; i < datos.length; i++) {
      if (!datos[i][COLS.VENDEDORAS.vendedora_id]) continue;
      const obj = _parsearFila(datos[i]);
      if (soloActivas && !obj.activo) continue;
      out.push(obj);
    }
    return out;
  }

  /**
   * Obtiene una vendedora por su ID.
   */
  function obtenerPorId(vendedora_id) {
    if (!vendedora_id) return null;
    const todas = listar(false);
    for (let i = 0; i < todas.length; i++) {
      if (todas[i].vendedora_id === vendedora_id) return todas[i];
    }
    return null;
  }

  /**
   * Obtiene una vendedora por su email (case-insensitive). Solo activas.
   * Esta función es la base de la autenticación.
   */
  function obtenerPorEmail(email) {
    if (!email) return null;
    const norm = String(email).trim().toLowerCase();
    const activas = listar(true);
    for (let i = 0; i < activas.length; i++) {
      if (activas[i].email === norm) return activas[i];
    }
    return null;
  }

  /**
   * Crea una nueva vendedora.
   */
  function crear(vendedora) {
    if (!vendedora.nombre || !vendedora.email || !vendedora.rol) {
      const e = new Error('Faltan campos requeridos: nombre, email, rol');
      e.codigo = ERR.VALIDACION;
      throw e;
    }
    if (obtenerPorEmail(vendedora.email)) {
      const e = new Error('Ya existe una vendedora con ese email');
      e.codigo = ERR.DUPLICADO;
      throw e;
    }
    const hoja = _hoja();
    const numero = siguienteNumeroId(hoja, COLS.VENDEDORAS.vendedora_id, CONFIG.PREFIJO_VENDEDORA);
    const id = generarId(CONFIG.PREFIJO_VENDEDORA, numero, CONFIG.PADDING_VENDEDORA);
    const nueva = {
      vendedora_id: id,
      nombre: vendedora.nombre,
      email: String(vendedora.email).trim().toLowerCase(),
      rol: vendedora.rol,
      activo: vendedora.activo !== false,
    };
    const fila = objetoAFila(nueva, COLS.VENDEDORAS, HEADERS.VENDEDORAS.length);
    hoja.appendRow(fila);
    return nueva;
  }

  /**
   * Actualiza una vendedora existente.
   */
  function actualizar(vendedora_id, cambios) {
    const hoja = _hoja();
    const ultima = hoja.getLastRow();
    if (ultima < 2) return null;
    const ancho = HEADERS.VENDEDORAS.length;
    const datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
    for (let i = 0; i < datos.length; i++) {
      if (datos[i][COLS.VENDEDORAS.vendedora_id] === vendedora_id) {
        const actual = _parsearFila(datos[i]);
        if (cambios.nombre !== undefined) actual.nombre = cambios.nombre;
        if (cambios.email !== undefined) actual.email = String(cambios.email).trim().toLowerCase();
        if (cambios.rol !== undefined) actual.rol = cambios.rol;
        if (cambios.activo !== undefined) actual.activo = toBool(cambios.activo);
        const filaNueva = objetoAFila(actual, COLS.VENDEDORAS, ancho);
        hoja.getRange(i + 2, 1, 1, ancho).setValues([filaNueva]);
        return actual;
      }
    }
    return null;
  }

  return {
    listar: listar,
    obtenerPorId: obtenerPorId,
    obtenerPorEmail: obtenerPorEmail,
    crear: crear,
    actualizar: actualizar,
  };
})();
