/**
 * Logic/PreciosService.gs
 * ----------------------------------------------------------------------------
 * Lista de precios con disponibilidad en tiempo real. Esta es la vista
 * que la vendedora abre durante una venta para mostrar al cliente.
 * ----------------------------------------------------------------------------
 */

const PreciosService = (function () {

  /**
   * Retorna el listado de precios. Si vendedora_id viene, "hay" se basa
   * en el stock de esa vendedora; si no, en el stock global.
   *
   * @param {string} vendedora_id  Opcional. Filtra por stock de una vendedora.
   * @return {Array<Object>}
   */
  function obtenerListadoPrecios(vendedora_id) {
    const productos = ProductosDAO.listar(true);
    const productosPorId = {};
    productos.forEach(function (p) { productosPorId[p.producto_id] = p; });

    const variantes = VariantesDAO.listar(true);
    const stockTodo = StockDAO.listar();

    // Calcular stock relevante por SKU
    const stockPorSku = {};
    stockTodo.forEach(function (s) {
      if (vendedora_id) {
        if (s.vendedora_id !== vendedora_id) return;
      }
      stockPorSku[s.sku] = (stockPorSku[s.sku] || 0) + s.cantidad;
    });

    return variantes
      .filter(function (v) { return productosPorId[v.producto_id]; })
      .map(function (v) {
        const prod = productosPorId[v.producto_id];
        const stk = stockPorSku[v.sku] || 0;
        return {
          sku: v.sku,
          nombre: prod.nombre,
          categoria: prod.categoria,
          talla: v.talla,
          precio_duena: v.precio_duena,
          precio_oferta: v.precio_oferta,
          hay: stk > 0,
          cantidad: stk,
        };
      })
      .sort(function (a, b) {
        const c = a.categoria.localeCompare(b.categoria);
        if (c !== 0) return c;
        const n = a.nombre.localeCompare(b.nombre);
        if (n !== 0) return n;
        return a.talla.localeCompare(b.talla);
      });
  }

  return {
    obtenerListadoPrecios: obtenerListadoPrecios,
  };
})();
