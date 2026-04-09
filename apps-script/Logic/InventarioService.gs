/**
 * Logic/InventarioService.gs
 * ----------------------------------------------------------------------------
 * Provee la vista agregada del inventario global (sumando stock de todas
 * las vendedoras) cruzada con la información de productos y variantes.
 * ----------------------------------------------------------------------------
 */

const InventarioService = (function () {

  /**
   * Retorna el inventario global con un objeto enriquecido por SKU.
   * @return {Array<Object>} [{sku, producto_id, nombre, talla, precio_duena, precio_oferta, stock_total, stock_por_vendedora: {V01: 2, V02: 1, ...}}]
   */
  function obtenerInventarioGlobal() {
    const productos = ProductosDAO.listar(false);
    const productosPorId = {};
    productos.forEach(function (p) { productosPorId[p.producto_id] = p; });

    const variantes = VariantesDAO.listar(false);
    const stock = StockDAO.listar();

    // Agrupar stock por sku
    const stockPorSku = {};
    stock.forEach(function (s) {
      if (!stockPorSku[s.sku]) stockPorSku[s.sku] = { total: 0, porVendedora: {} };
      stockPorSku[s.sku].total += s.cantidad;
      stockPorSku[s.sku].porVendedora[s.vendedora_id] = s.cantidad;
    });

    return variantes.map(function (v) {
      const prod = productosPorId[v.producto_id] || {};
      const stk = stockPorSku[v.sku] || { total: 0, porVendedora: {} };
      return {
        sku: v.sku,
        producto_id: v.producto_id,
        nombre: prod.nombre || '(sin producto)',
        categoria: prod.categoria || '',
        talla: v.talla,
        costo: v.costo,
        precio_duena: v.precio_duena,
        precio_oferta: v.precio_oferta,
        activo: v.activo && (prod.activo !== false),
        stock_total: stk.total,
        stock_por_vendedora: stk.porVendedora,
      };
    });
  }

  return {
    obtenerInventarioGlobal: obtenerInventarioGlobal,
  };
})();
