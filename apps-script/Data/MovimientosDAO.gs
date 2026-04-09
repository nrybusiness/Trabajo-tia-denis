/**
 * Data/MovimientosDAO.gs
 * ----------------------------------------------------------------------------
 * Capa de acceso a datos para la hoja `Movimientos`. Append-only por diseño:
 * NO se permite editar ni borrar movimientos. Las correcciones se hacen
 * con un nuevo movimiento tipo AJUSTE.
 * ----------------------------------------------------------------------------
 */

const MovimientosDAO = (function () {

  function _hoja() {
    return obtenerHoja(HOJAS.MOVIMIENTOS);
  }

  function _parsearFila(fila) {
    const obj = filaAObjeto(fila, COLS.MOVIMIENTOS);
    obj.cantidad = toInt(obj.cantidad);
    return obj;
  }

  /**
   * Lista todos los movimientos. Cuidado con el tamaño en producción —
   * usar listarFiltrado() para queries específicas.
   */
  function listar() {
    const hoja = _hoja();
    const ultima = hoja.getLastRow();
    if (ultima < 2) return [];
    const ancho = HEADERS.MOVIMIENTOS.length;
    const datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
    const out = [];
    for (let i = 0; i < datos.length; i++) {
      if (!datos[i][COLS.MOVIMIENTOS.mov_id]) continue;
      out.push(_parsearFila(datos[i]));
    }
    return out;
  }

  /**
   * Lista filtrada con criterios opcionales.
   * @param {Object} filtros {desde, hasta, tipo, sku, vendedora_id, limite}
   */
  function listarFiltrado(filtros) {
    filtros = filtros || {};
    const todos = listar();
    let filtrados = todos.filter(function (m) {
      if (filtros.desde && !fechaMenorIgual(filtros.desde, m.fecha)) return false;
      if (filtros.hasta && !fechaMenorIgual(m.fecha, filtros.hasta)) return false;
      if (filtros.tipo && m.tipo !== filtros.tipo) return false;
      if (filtros.sku && m.sku !== filtros.sku) return false;
      if (filtros.vendedora_id && m.vendedora_id !== filtros.vendedora_id && m.destino_id !== filtros.vendedora_id) return false;
      return true;
    });
    // Orden descendente por fecha
    filtrados.sort(function (a, b) {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
    if (filtros.limite && filtros.limite > 0) {
      filtrados = filtrados.slice(0, filtros.limite);
    }
    return filtrados;
  }

  /**
   * Agrega un movimiento nuevo. Genera ID automáticamente.
   * @param {Object} mov {tipo, sku, cantidad, vendedora_id, destino_id?, notas?, usuario_email}
   * @return {Object} El movimiento creado con su mov_id y fecha.
   */
  function append(mov) {
    if (!mov.tipo || !mov.sku || mov.cantidad === undefined || !mov.vendedora_id) {
      const e = new Error('Movimiento incompleto: faltan tipo/sku/cantidad/vendedora_id');
      e.codigo = ERR.VALIDACION;
      throw e;
    }
    const hoja = _hoja();
    const numero = siguienteNumeroId(hoja, COLS.MOVIMIENTOS.mov_id, CONFIG.PREFIJO_MOVIMIENTO);
    const id = generarId(CONFIG.PREFIJO_MOVIMIENTO, numero, CONFIG.PADDING_MOVIMIENTO);
    const nuevo = {
      mov_id: id,
      fecha: nowIso(),
      tipo: mov.tipo,
      sku: mov.sku,
      cantidad: toInt(mov.cantidad),
      vendedora_id: mov.vendedora_id,
      destino_id: mov.destino_id || '',
      notas: mov.notas || '',
      usuario_email: mov.usuario_email || '',
    };
    const fila = objetoAFila(nuevo, COLS.MOVIMIENTOS, HEADERS.MOVIMIENTOS.length);
    hoja.appendRow(fila);
    return nuevo;
  }

  return {
    listar: listar,
    listarFiltrado: listarFiltrado,
    append: append,
  };
})();
