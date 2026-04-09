/**
 * Logic/KardexService.gs
 * ----------------------------------------------------------------------------
 * Provee el kardex (inventario) personal de una vendedora específica.
 * ----------------------------------------------------------------------------
 */

const KardexService = (function () {

  /**
   * Retorna las prendas que tiene una vendedora con cantidad > 0.
   * @param {string} vendedora_id
   * @return {Array<Object>}
   */
  function obtenerKardex(vendedora_id) {
    if (!vendedora_id) return [];

    const filasStock = StockDAO.listarPorVendedora(vendedora_id, false);
    if (filasStock.length === 0) return [];

    // Mapas auxiliares
    const variantes = VariantesDAO.listar(false);
    const variantesPorSku = {};
    variantes.forEach(function (v) { variantesPorSku[v.sku] = v; });

    const productos = ProductosDAO.listar(false);
    const productosPorId = {};
    productos.forEach(function (p) { productosPorId[p.producto_id] = p; });

    return filasStock.map(function (s) {
      const v = variantesPorSku[s.sku] || {};
      const p = productosPorId[v.producto_id] || {};
      return {
        sku: s.sku,
        nombre: p.nombre || '(sin producto)',
        categoria: p.categoria || '',
        talla: v.talla || '',
        cantidad: s.cantidad,
        precio_duena: v.precio_duena || 0,
        precio_oferta: v.precio_oferta || 0,
        valor_costo: (v.costo || 0) * s.cantidad,
        valor_venta: (v.precio_oferta || 0) * s.cantidad,
      };
    }).sort(function (a, b) {
      // Ordenar por nombre, luego talla
      const cmpNombre = a.nombre.localeCompare(b.nombre);
      if (cmpNombre !== 0) return cmpNombre;
      return a.talla.localeCompare(b.talla);
    });
  }

  /**
   * Retorna métricas resumen del kardex de una vendedora.
   */
  function obtenerResumenKardex(vendedora_id) {
    const items = obtenerKardex(vendedora_id);
    let totalUnidades = 0;
    let valorCosto = 0;
    let valorVenta = 0;
    items.forEach(function (i) {
      totalUnidades += i.cantidad;
      valorCosto += i.valor_costo;
      valorVenta += i.valor_venta;
    });
    return {
      total_skus: items.length,
      total_unidades: totalUnidades,
      valor_costo: valorCosto,
      valor_venta: valorVenta,
    };
  }

  return {
    obtenerKardex: obtenerKardex,
    obtenerResumenKardex: obtenerResumenKardex,
  };
})();
