/**
 * Data/StockDAO.gs
 * ----------------------------------------------------------------------------
 * Capa de acceso a datos para la hoja `Stock`. PK compuesta (sku, vendedora_id).
 * Provee operaciones atómicas de lectura, incremento y decremento.
 * ----------------------------------------------------------------------------
 */

const StockDAO = (function () {

  function _hoja() {
    return obtenerHoja(HOJAS.STOCK);
  }

  function _parsearFila(fila) {
    const obj = filaAObjeto(fila, COLS.STOCK);
    obj.cantidad = toInt(obj.cantidad);
    return obj;
  }

  /**
   * Lista TODO el stock. Para vistas globales.
   */
  function listar() {
    const hoja = _hoja();
    const ultima = hoja.getLastRow();
    if (ultima < 2) return [];
    const ancho = HEADERS.STOCK.length;
    const datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
    const out = [];
    for (let i = 0; i < datos.length; i++) {
      if (!datos[i][COLS.STOCK.sku]) continue;
      out.push(_parsearFila(datos[i]));
    }
    return out;
  }

  /**
   * Lista el stock de una vendedora específica (su kardex).
   * Solo retorna filas con cantidad > 0 a menos que incluirCero = true.
   */
  function listarPorVendedora(vendedora_id, incluirCero) {
    const todas = listar();
    return todas.filter(function (s) {
      if (s.vendedora_id !== vendedora_id) return false;
      if (!incluirCero && s.cantidad <= 0) return false;
      return true;
    });
  }

  /**
   * Lista todas las filas para un SKU específico (todas las vendedoras).
   */
  function listarPorSku(sku) {
    const todas = listar();
    return todas.filter(function (s) { return s.sku === sku; });
  }

  /**
   * Obtiene la cantidad actual de un (sku, vendedora_id). Retorna 0 si no existe.
   */
  function obtenerCantidad(sku, vendedora_id) {
    const todas = listar();
    for (let i = 0; i < todas.length; i++) {
      if (todas[i].sku === sku && todas[i].vendedora_id === vendedora_id) {
        return todas[i].cantidad;
      }
    }
    return 0;
  }

  /**
   * Actualiza (o crea si no existe) la fila de stock de un (sku, vendedora_id).
   * Retorna la nueva cantidad.
   */
  function _setearCantidad(sku, vendedora_id, nuevaCantidad) {
    const hoja = _hoja();
    const ultima = hoja.getLastRow();
    const ancho = HEADERS.STOCK.length;
    if (ultima >= 2) {
      const datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
      for (let i = 0; i < datos.length; i++) {
        if (datos[i][COLS.STOCK.sku] === sku && datos[i][COLS.STOCK.vendedora_id] === vendedora_id) {
          hoja.getRange(i + 2, COLS.STOCK.cantidad + 1).setValue(nuevaCantidad);
          return nuevaCantidad;
        }
      }
    }
    // No existía, crear fila nueva
    const nueva = { sku: sku, vendedora_id: vendedora_id, cantidad: nuevaCantidad };
    const fila = objetoAFila(nueva, COLS.STOCK, ancho);
    hoja.appendRow(fila);
    return nuevaCantidad;
  }

  /**
   * Suma `delta` (puede ser negativo) al stock de (sku, vendedora_id).
   * Lanza error si quedaría negativo y permitirNegativo es false.
   */
  function ajustar(sku, vendedora_id, delta, permitirNegativo) {
    const actual = obtenerCantidad(sku, vendedora_id);
    const nueva = actual + delta;
    if (nueva < 0 && !permitirNegativo) {
      const e = new Error('Stock insuficiente. Disponible: ' + actual + ', requerido: ' + Math.abs(delta));
      e.codigo = ERR.STOCK_INSUFICIENTE;
      throw e;
    }
    return _setearCantidad(sku, vendedora_id, nueva);
  }

  /**
   * Decrementa stock. Conveniente para ventas.
   */
  function decrementar(sku, vendedora_id, cantidad) {
    return ajustar(sku, vendedora_id, -Math.abs(cantidad), false);
  }

  /**
   * Incrementa stock. Conveniente para ingresos/recepciones.
   */
  function incrementar(sku, vendedora_id, cantidad) {
    return ajustar(sku, vendedora_id, Math.abs(cantidad), false);
  }

  /**
   * Reemplaza completamente la hoja Stock con nuevas filas.
   * Usado por ReportesService.recalcularStock().
   */
  function reemplazarTodo(filas) {
    const hoja = _hoja();
    const ancho = HEADERS.STOCK.length;
    const ultima = hoja.getLastRow();
    if (ultima >= 2) {
      hoja.getRange(2, 1, ultima - 1, ancho).clearContent();
    }
    if (filas.length === 0) return;
    const matriz = filas.map(function (f) {
      return objetoAFila(f, COLS.STOCK, ancho);
    });
    hoja.getRange(2, 1, matriz.length, ancho).setValues(matriz);
  }

  return {
    listar: listar,
    listarPorVendedora: listarPorVendedora,
    listarPorSku: listarPorSku,
    obtenerCantidad: obtenerCantidad,
    ajustar: ajustar,
    decrementar: decrementar,
    incrementar: incrementar,
    reemplazarTodo: reemplazarTodo,
  };
})();
