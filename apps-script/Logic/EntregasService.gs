/**
 * Logic/EntregasService.gs
 * ----------------------------------------------------------------------------
 * Maneja entregas (vendedora → dueña) e ingresos (dueña → vendedora).
 * Ambos son transferencias de stock entre poseedores, registradas como
 * movimientos distintos para auditoría.
 * ----------------------------------------------------------------------------
 */

const EntregasService = (function () {

  /**
   * Registra una entrega: vendedora devuelve producto a la dueña.
   * @param {Object} payload {sku, cantidad, vendedora_id, destino_id, notas?}
   * @param {Object} usuarioActual
   */
  function registrarEntrega(payload, usuarioActual) {
    return _transferir(payload, usuarioActual, TIPOS_MOVIMIENTO.ENTREGA);
  }

  /**
   * Registra un ingreso: dueña asigna stock a una vendedora.
   * @param {Object} payload {sku, cantidad, vendedora_id (origen), destino_id, notas?}
   * @param {Object} usuarioActual
   */
  function registrarIngreso(payload, usuarioActual) {
    // Solo admin/superadmin pueden hacer ingresos
    if (usuarioActual.rol !== ROLES.ADMIN && usuarioActual.rol !== ROLES.SUPERADMIN) {
      throw _err('Solo admin puede registrar ingresos', ERR.FORBIDDEN);
    }
    return _transferir(payload, usuarioActual, TIPOS_MOVIMIENTO.INGRESO);
  }

  function _transferir(payload, usuarioActual, tipo) {
    validarCamposRequeridos(payload, ['sku', 'cantidad', 'vendedora_id', 'destino_id']);

    const cantidad = toInt(payload.cantidad);
    if (cantidad <= 0) {
      throw _err('La cantidad debe ser mayor a 0', ERR.VALIDACION);
    }

    if (payload.vendedora_id === payload.destino_id) {
      throw _err('Origen y destino no pueden ser la misma vendedora', ERR.VALIDACION);
    }

    // Validar SKU existe
    if (!VariantesDAO.obtenerPorSku(payload.sku)) {
      throw _err('SKU no existe: ' + payload.sku, ERR.SKU_NO_EXISTE);
    }

    // Validar vendedoras existen
    if (!VendedorasDAO.obtenerPorId(payload.vendedora_id)) {
      throw _err('Vendedora origen no existe', ERR.VENDEDORA_NO_EXISTE);
    }
    if (!VendedorasDAO.obtenerPorId(payload.destino_id)) {
      throw _err('Vendedora destino no existe', ERR.VENDEDORA_NO_EXISTE);
    }

    // Restricción para vendedoras normales: solo pueden hacer ENTREGA desde su propio stock
    if (usuarioActual.rol === ROLES.VENDEDORA) {
      if (usuarioActual.vendedora_id !== payload.vendedora_id) {
        throw _err('No puedes mover stock de otra vendedora', ERR.FORBIDDEN);
      }
      if (tipo !== TIPOS_MOVIMIENTO.ENTREGA) {
        throw _err('Solo puedes registrar entregas', ERR.FORBIDDEN);
      }
    }

    // Validar stock disponible en origen
    const disponible = StockDAO.obtenerCantidad(payload.sku, payload.vendedora_id);
    if (disponible < cantidad) {
      throw _err('Stock insuficiente. Disponible: ' + disponible, ERR.STOCK_INSUFICIENTE);
    }

    // Escribir bitácora
    const mov = MovimientosDAO.append({
      tipo: tipo,
      sku: payload.sku,
      cantidad: cantidad,
      vendedora_id: payload.vendedora_id,
      destino_id: payload.destino_id,
      notas: payload.notas || '',
      usuario_email: usuarioActual.email || '',
    });

    // Mover stock: restar del origen, sumar al destino
    StockDAO.decrementar(payload.sku, payload.vendedora_id, cantidad);
    StockDAO.incrementar(payload.sku, payload.destino_id, cantidad);

    return mov;
  }

  function _err(msg, codigo) {
    const e = new Error(msg);
    e.codigo = codigo;
    return e;
  }

  return {
    registrarEntrega: registrarEntrega,
    registrarIngreso: registrarIngreso,
  };
})();
