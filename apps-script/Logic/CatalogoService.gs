/**
 * Logic/CatalogoService.gs
 * ----------------------------------------------------------------------------
 * Reglas de negocio para gestión de catálogo (productos + variantes).
 * Solo admin/superadmin pueden modificar.
 * ----------------------------------------------------------------------------
 */

const CatalogoService = (function () {

  function crearProducto(payload, usuarioActual) {
    validarCamposRequeridos(payload, ['nombre']);
    if (ProductosDAO.existeNombre(payload.nombre)) {
      throw _err('Ya existe un producto con ese nombre', ERR.DUPLICADO);
    }
    return ProductosDAO.crear({
      nombre: payload.nombre.trim(),
      categoria: payload.categoria || 'Otros',
      activo: true,
    });
  }

  function editarProducto(payload, usuarioActual) {
    validarCamposRequeridos(payload, ['producto_id']);
    const actualizado = ProductosDAO.actualizar(payload.producto_id, {
      nombre: payload.nombre,
      categoria: payload.categoria,
      activo: payload.activo,
    });
    if (!actualizado) {
      throw _err('Producto no encontrado: ' + payload.producto_id, ERR.PRODUCTO_NO_EXISTE);
    }
    return actualizado;
  }

  function crearVariante(payload, usuarioActual) {
    validarCamposRequeridos(payload, ['producto_id', 'talla', 'costo', 'precio_duena', 'precio_oferta']);

    // Validar talla
    const tallasValidas = [TALLAS.UNICA, TALLAS.SM, TALLAS.LXL];
    if (tallasValidas.indexOf(payload.talla) === -1) {
      throw _err('Talla inválida: ' + payload.talla + '. Válidas: ' + tallasValidas.join(', '), ERR.VALIDACION);
    }

    // Validar producto existe
    if (!ProductosDAO.obtenerPorId(payload.producto_id)) {
      throw _err('Producto no existe: ' + payload.producto_id, ERR.PRODUCTO_NO_EXISTE);
    }

    return VariantesDAO.crear({
      producto_id: payload.producto_id,
      talla: payload.talla,
      costo: payload.costo,
      precio_duena: payload.precio_duena,
      precio_oferta: payload.precio_oferta,
      activo: true,
    });
  }

  function editarVariante(payload, usuarioActual) {
    validarCamposRequeridos(payload, ['sku']);
    const actualizado = VariantesDAO.actualizar(payload.sku, {
      costo: payload.costo,
      precio_duena: payload.precio_duena,
      precio_oferta: payload.precio_oferta,
      activo: payload.activo,
    });
    if (!actualizado) {
      throw _err('Variante no encontrada: ' + payload.sku, ERR.SKU_NO_EXISTE);
    }
    return actualizado;
  }

  function listarProductos() {
    return ProductosDAO.listar(false);
  }

  function listarVariantes(producto_id) {
    if (producto_id) return VariantesDAO.listarPorProducto(producto_id);
    return VariantesDAO.listar(false);
  }

  function _err(msg, codigo) {
    const e = new Error(msg);
    e.codigo = codigo;
    return e;
  }

  return {
    crearProducto: crearProducto,
    editarProducto: editarProducto,
    crearVariante: crearVariante,
    editarVariante: editarVariante,
    listarProductos: listarProductos,
    listarVariantes: listarVariantes,
  };
})();
