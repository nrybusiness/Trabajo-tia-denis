/**
 * Data/VariantesDAO.gs
 * ----------------------------------------------------------------------------
 * Capa de acceso a datos para la hoja `Variantes` (SKUs).
 * ----------------------------------------------------------------------------
 */

const VariantesDAO = (function () {

  function _hoja() {
    return obtenerHoja(HOJAS.VARIANTES);
  }

  function _parsearFila(fila) {
    const obj = filaAObjeto(fila, COLS.VARIANTES);
    obj.costo = toInt(obj.costo);
    obj.precio_duena = toInt(obj.precio_duena);
    obj.precio_oferta = toInt(obj.precio_oferta);
    obj.activo = toBool(obj.activo);
    return obj;
  }

  /**
   * Lista todas las variantes. soloActivos filtra inactivas.
   */
  function listar(soloActivos) {
    const hoja = _hoja();
    const ultima = hoja.getLastRow();
    if (ultima < 2) return [];
    const ancho = HEADERS.VARIANTES.length;
    const datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
    const out = [];
    for (let i = 0; i < datos.length; i++) {
      if (!datos[i][COLS.VARIANTES.sku]) continue;
      const obj = _parsearFila(datos[i]);
      if (soloActivos && !obj.activo) continue;
      out.push(obj);
    }
    return out;
  }

  /**
   * Lista las variantes de un producto específico.
   */
  function listarPorProducto(producto_id) {
    const todas = listar(false);
    return todas.filter(function (v) { return v.producto_id === producto_id; });
  }

  /**
   * Obtiene una variante por su SKU. Retorna null si no existe.
   */
  function obtenerPorSku(sku) {
    if (!sku) return null;
    const todas = listar(false);
    for (let i = 0; i < todas.length; i++) {
      if (todas[i].sku === sku) return todas[i];
    }
    return null;
  }

  /**
   * Crea una nueva variante. El SKU se construye como {producto_id}-{talla}.
   * Lanza error si ya existe ese SKU.
   */
  function crear(variante) {
    const sku = variante.producto_id + '-' + variante.talla;
    if (obtenerPorSku(sku)) {
      const e = new Error('Ya existe una variante con SKU: ' + sku);
      e.codigo = ERR.DUPLICADO;
      throw e;
    }
    const nueva = {
      sku: sku,
      producto_id: variante.producto_id,
      talla: variante.talla,
      costo: toInt(variante.costo),
      precio_duena: toInt(variante.precio_duena),
      precio_oferta: toInt(variante.precio_oferta),
      activo: variante.activo !== false,
    };
    const hoja = _hoja();
    const fila = objetoAFila(nueva, COLS.VARIANTES, HEADERS.VARIANTES.length);
    hoja.appendRow(fila);
    return nueva;
  }

  /**
   * Actualiza una variante existente. Solo modifica los campos provistos.
   */
  function actualizar(sku, cambios) {
    const hoja = _hoja();
    const ultima = hoja.getLastRow();
    if (ultima < 2) return null;
    const ancho = HEADERS.VARIANTES.length;
    const datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
    for (let i = 0; i < datos.length; i++) {
      if (datos[i][COLS.VARIANTES.sku] === sku) {
        const actual = _parsearFila(datos[i]);
        if (cambios.costo !== undefined) actual.costo = toInt(cambios.costo);
        if (cambios.precio_duena !== undefined) actual.precio_duena = toInt(cambios.precio_duena);
        if (cambios.precio_oferta !== undefined) actual.precio_oferta = toInt(cambios.precio_oferta);
        if (cambios.activo !== undefined) actual.activo = toBool(cambios.activo);
        const filaNueva = objetoAFila(actual, COLS.VARIANTES, ancho);
        hoja.getRange(i + 2, 1, 1, ancho).setValues([filaNueva]);
        return actual;
      }
    }
    return null;
  }

  return {
    listar: listar,
    listarPorProducto: listarPorProducto,
    obtenerPorSku: obtenerPorSku,
    crear: crear,
    actualizar: actualizar,
  };
})();
