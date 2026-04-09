/**
 * Logic/ReportesService.gs
 * ----------------------------------------------------------------------------
 * Genera reportes agregados para el dashboard del admin: totales vendidos,
 * top productos, stock muerto, valor del inventario, alertas de stock bajo.
 * También expone la función de recálculo de stock desde movimientos.
 * ----------------------------------------------------------------------------
 */

const ReportesService = (function () {

  /**
   * Resumen del dashboard. Acepta filtro de fechas opcional.
   * @param {Object} filtros {desde?, hasta?}
   */
  function dashboardResumen(filtros) {
    filtros = filtros || {};

    const movs = MovimientosDAO.listarFiltrado({
      desde: filtros.desde,
      hasta: filtros.hasta,
      tipo: TIPOS_MOVIMIENTO.VENTA,
    });

    const variantes = VariantesDAO.listar(false);
    const variantesPorSku = {};
    variantes.forEach(function (v) { variantesPorSku[v.sku] = v; });

    const productos = ProductosDAO.listar(false);
    const productosPorId = {};
    productos.forEach(function (p) { productosPorId[p.producto_id] = p; });

    const vendedoras = VendedorasDAO.listar(false);
    const vendedorasPorId = {};
    vendedoras.forEach(function (v) { vendedorasPorId[v.vendedora_id] = v; });

    // Total vendido y unidades
    let totalVendidoCop = 0;
    let unidadesVendidas = 0;
    const ventasPorVend = {};
    const ventasPorSku = {};

    movs.forEach(function (m) {
      const v = variantesPorSku[m.sku];
      if (!v) return;
      const monto = (v.precio_oferta || 0) * m.cantidad;
      totalVendidoCop += monto;
      unidadesVendidas += m.cantidad;

      if (!ventasPorVend[m.vendedora_id]) {
        ventasPorVend[m.vendedora_id] = { total: 0, unidades: 0 };
      }
      ventasPorVend[m.vendedora_id].total += monto;
      ventasPorVend[m.vendedora_id].unidades += m.cantidad;

      if (!ventasPorSku[m.sku]) {
        ventasPorSku[m.sku] = { total: 0, unidades: 0 };
      }
      ventasPorSku[m.sku].total += monto;
      ventasPorSku[m.sku].unidades += m.cantidad;
    });

    // Convertir ventasPorVend a array
    const ventasPorVendedora = Object.keys(ventasPorVend).map(function (vid) {
      const v = vendedorasPorId[vid] || {};
      return {
        vendedora_id: vid,
        nombre: v.nombre || '(eliminada)',
        total: ventasPorVend[vid].total,
        unidades: ventasPorVend[vid].unidades,
      };
    }).sort(function (a, b) { return b.total - a.total; });

    // Top productos (10 más vendidos)
    const topProductos = Object.keys(ventasPorSku).map(function (sku) {
      const v = variantesPorSku[sku] || {};
      const p = productosPorId[v.producto_id] || {};
      return {
        sku: sku,
        nombre: p.nombre || '',
        talla: v.talla || '',
        unidades: ventasPorSku[sku].unidades,
        total: ventasPorSku[sku].total,
      };
    }).sort(function (a, b) { return b.unidades - a.unidades; }).slice(0, 10);

    // Valor inventario (a costo y a venta)
    const stock = StockDAO.listar();
    let valorCosto = 0;
    let valorVenta = 0;
    const stockPorSku = {};
    stock.forEach(function (s) {
      const v = variantesPorSku[s.sku];
      if (!v) return;
      valorCosto += (v.costo || 0) * s.cantidad;
      valorVenta += (v.precio_oferta || 0) * s.cantidad;
      stockPorSku[s.sku] = (stockPorSku[s.sku] || 0) + s.cantidad;
    });

    // Stock muerto: SKUs con stock > 0 y 0 ventas en el periodo
    const stockMuerto = Object.keys(stockPorSku).filter(function (sku) {
      return stockPorSku[sku] > 0 && !ventasPorSku[sku];
    }).map(function (sku) {
      const v = variantesPorSku[sku] || {};
      const p = productosPorId[v.producto_id] || {};
      return {
        sku: sku,
        nombre: p.nombre || '',
        talla: v.talla || '',
        cantidad: stockPorSku[sku],
      };
    });

    // Alertas de stock bajo
    const umbral = toInt(ConfigDAO.obtener(CONFIG_KEYS.STOCK_BAJO_UMBRAL, '2'));
    const alertasStockBajo = Object.keys(stockPorSku).filter(function (sku) {
      return stockPorSku[sku] > 0 && stockPorSku[sku] <= umbral;
    }).map(function (sku) {
      const v = variantesPorSku[sku] || {};
      const p = productosPorId[v.producto_id] || {};
      return {
        sku: sku,
        nombre: p.nombre || '',
        talla: v.talla || '',
        cantidad: stockPorSku[sku],
      };
    });

    return {
      total_vendido_cop: totalVendidoCop,
      unidades_vendidas: unidadesVendidas,
      ventas_por_vendedora: ventasPorVendedora,
      top_productos: topProductos,
      stock_muerto: stockMuerto,
      valor_inventario_costo: valorCosto,
      valor_inventario_venta: valorVenta,
      alertas_stock_bajo: alertasStockBajo,
    };
  }

  /**
   * Reconstruye la hoja Stock íntegra desde la bitácora de Movimientos.
   * Función de emergencia ante desincronización.
   */
  function recalcularStock() {
    const movs = MovimientosDAO.listar();
    // Ordenar cronológicamente
    movs.sort(function (a, b) {
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    });

    const acum = {}; // {sku|vendedora_id: cantidad}
    function _key(sku, vid) { return sku + '|' + vid; }
    function _sumar(sku, vid, delta) {
      const k = _key(sku, vid);
      acum[k] = (acum[k] || 0) + delta;
    }

    movs.forEach(function (m) {
      switch (m.tipo) {
        case TIPOS_MOVIMIENTO.VENTA:
          _sumar(m.sku, m.vendedora_id, -m.cantidad);
          break;
        case TIPOS_MOVIMIENTO.ENTREGA:
        case TIPOS_MOVIMIENTO.INGRESO:
          _sumar(m.sku, m.vendedora_id, -m.cantidad);
          _sumar(m.sku, m.destino_id, m.cantidad);
          break;
        case TIPOS_MOVIMIENTO.AJUSTE:
          _sumar(m.sku, m.vendedora_id, m.cantidad);
          break;
      }
    });

    const filas = Object.keys(acum).map(function (k) {
      const partes = k.split('|');
      return { sku: partes[0], vendedora_id: partes[1], cantidad: acum[k] };
    });

    StockDAO.reemplazarTodo(filas);
    return { filas_escritas: filas.length };
  }

  /**
   * Exporta snapshot completo del sistema como JSON.
   */
  function exportarBackup() {
    return {
      exportado: nowIso(),
      version: CONFIG.VERSION_SCHEMA,
      productos: ProductosDAO.listar(false),
      variantes: VariantesDAO.listar(false),
      vendedoras: VendedorasDAO.listar(false),
      stock: StockDAO.listar(),
      movimientos: MovimientosDAO.listar(),
      config: ConfigDAO.listar(),
    };
  }

  return {
    dashboardResumen: dashboardResumen,
    recalcularStock: recalcularStock,
    exportarBackup: exportarBackup,
  };
})();
