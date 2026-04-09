/**
 * Logic/VentasService.gs
 * ----------------------------------------------------------------------------
 * Reglas de negocio para registrar ventas. Valida disponibilidad, escribe
 * la bitácora y descuenta stock atómicamente.
 * ----------------------------------------------------------------------------
 */

const VentasService = (function () {

  /**
   * Registra una venta.
   * @param {Object} payload {sku, cantidad, vendedora_id, notas?}
   * @param {Object} usuarioActual {email, vendedora_id, rol}
   * @return {Object} El movimiento creado
   */
  function registrarVenta(payload, usuarioActual) {
    validarCamposRequeridos(payload, ['sku', 'cantidad', 'vendedora_id']);

    const cantidad = toInt(payload.cantidad);
    if (cantidad <= 0) {
      throw _err('La cantidad debe ser mayor a 0', ERR.VALIDACION);
    }

    // Validar SKU existe
    const variante = VariantesDAO.obtenerPorSku(payload.sku);
    if (!variante) {
      throw _err('SKU no existe: ' + payload.sku, ERR.SKU_NO_EXISTE);
    }

    // Validar vendedora existe
    const vendedora = VendedorasDAO.obtenerPorId(payload.vendedora_id);
    if (!vendedora) {
      throw _err('Vendedora no existe: ' + payload.vendedora_id, ERR.VENDEDORA_NO_EXISTE);
    }

    // Si es vendedora normal, solo puede vender de su propio stock
    if (usuarioActual.rol === ROLES.VENDEDORA &&
        usuarioActual.vendedora_id !== payload.vendedora_id) {
      throw _err('No puedes registrar ventas para otra vendedora', ERR.FORBIDDEN);
    }

    // Validar stock disponible
    const disponible = StockDAO.obtenerCantidad(payload.sku, payload.vendedora_id);
    const permitirNeg = ConfigDAO.obtener(CONFIG_KEYS.PERMITIR_STOCK_NEGATIVO, 'false') === 'true';
    if (disponible < cantidad && !permitirNeg) {
      throw _err('Stock insuficiente. Disponible: ' + disponible, ERR.STOCK_INSUFICIENTE);
    }

    // Escribir bitácora primero
    const mov = MovimientosDAO.append({
      tipo: TIPOS_MOVIMIENTO.VENTA,
      sku: payload.sku,
      cantidad: cantidad,
      vendedora_id: payload.vendedora_id,
      destino_id: '',
      notas: payload.notas || '',
      usuario_email: usuarioActual.email || '',
    });

    // Descontar stock
    StockDAO.decrementar(payload.sku, payload.vendedora_id, cantidad);

    return mov;
  }

  function _err(msg, codigo) {
    const e = new Error(msg);
    e.codigo = codigo;
    return e;
  }

  return {
    registrarVenta: registrarVenta,
  };
})();
