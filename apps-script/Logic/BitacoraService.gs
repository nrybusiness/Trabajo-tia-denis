/**
 * Logic/BitacoraService.gs
 * ----------------------------------------------------------------------------
 * Consulta y filtrado de la bitácora de movimientos. Enriquece los
 * movimientos con nombres legibles (producto, vendedora) para mostrar
 * en el frontend.
 * ----------------------------------------------------------------------------
 */

const BitacoraService = (function () {

  /**
   * Lista movimientos filtrados y enriquecidos con nombres.
   * @param {Object} filtros {desde, hasta, tipo, sku, vendedora_id, limite}
   */
  function listar(filtros) {
    const movs = MovimientosDAO.listarFiltrado(filtros || {});

    // Mapas auxiliares para enriquecimiento
    const variantes = VariantesDAO.listar(false);
    const variantesPorSku = {};
    variantes.forEach(function (v) { variantesPorSku[v.sku] = v; });

    const productos = ProductosDAO.listar(false);
    const productosPorId = {};
    productos.forEach(function (p) { productosPorId[p.producto_id] = p; });

    const vendedoras = VendedorasDAO.listar(false);
    const vendedorasPorId = {};
    vendedoras.forEach(function (v) { vendedorasPorId[v.vendedora_id] = v; });

    return movs.map(function (m) {
      const v = variantesPorSku[m.sku] || {};
      const p = productosPorId[v.producto_id] || {};
      const vendOrigen = vendedorasPorId[m.vendedora_id] || {};
      const vendDestino = vendedorasPorId[m.destino_id] || {};
      return {
        mov_id: m.mov_id,
        fecha: m.fecha,
        tipo: m.tipo,
        sku: m.sku,
        producto_nombre: p.nombre || '(producto eliminado)',
        talla: v.talla || '',
        cantidad: m.cantidad,
        vendedora_id: m.vendedora_id,
        vendedora_nombre: vendOrigen.nombre || '',
        destino_id: m.destino_id,
        destino_nombre: vendDestino.nombre || '',
        notas: m.notas,
        usuario_email: m.usuario_email,
      };
    });
  }

  /**
   * Ajuste manual de stock (solo superadmin). Crea un movimiento AJUSTE
   * con el delta indicado y actualiza el stock.
   */
  function ajustarStock(payload, usuarioActual) {
    if (usuarioActual.rol !== ROLES.SUPERADMIN) {
      throw _err('Solo superadmin puede ajustar stock manualmente', ERR.FORBIDDEN);
    }
    validarCamposRequeridos(payload, ['sku', 'vendedora_id', 'delta']);

    const delta = toInt(payload.delta);
    if (delta === 0) {
      throw _err('El delta no puede ser 0', ERR.VALIDACION);
    }

    if (!VariantesDAO.obtenerPorSku(payload.sku)) {
      throw _err('SKU no existe', ERR.SKU_NO_EXISTE);
    }
    if (!VendedorasDAO.obtenerPorId(payload.vendedora_id)) {
      throw _err('Vendedora no existe', ERR.VENDEDORA_NO_EXISTE);
    }

    // Escribir bitácora
    const mov = MovimientosDAO.append({
      tipo: TIPOS_MOVIMIENTO.AJUSTE,
      sku: payload.sku,
      cantidad: delta,
      vendedora_id: payload.vendedora_id,
      destino_id: '',
      notas: payload.notas || 'Ajuste manual',
      usuario_email: usuarioActual.email,
    });

    // Aplicar al stock (permitir negativo en ajustes)
    StockDAO.ajustar(payload.sku, payload.vendedora_id, delta, true);

    return mov;
  }

  function _err(msg, codigo) {
    const e = new Error(msg);
    e.codigo = codigo;
    return e;
  }

  return {
    listar: listar,
    ajustarStock: ajustarStock,
  };
})();
