/**
 * Data/ProductosDAO.gs
 * ----------------------------------------------------------------------------
 * Capa de acceso a datos para la hoja `Productos`. Solo lee/escribe celdas.
 * No conoce reglas de negocio.
 * ----------------------------------------------------------------------------
 */

const ProductosDAO = (function () {

  function _hoja() {
    return obtenerHoja(HOJAS.PRODUCTOS);
  }

  /**
   * Lista todos los productos. Si soloActivos = true, filtra los inactivos.
   * @return {Array<Object>}
   */
  function listar(soloActivos) {
    const hoja = _hoja();
    const ultima = hoja.getLastRow();
    if (ultima < 2) return [];
    const ancho = HEADERS.PRODUCTOS.length;
    const datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
    const out = [];
    for (let i = 0; i < datos.length; i++) {
      const obj = filaAObjeto(datos[i], COLS.PRODUCTOS);
      obj.activo = toBool(obj.activo);
      if (!obj.producto_id) continue;
      if (soloActivos && !obj.activo) continue;
      out.push(obj);
    }
    return out;
  }

  /**
   * Busca un producto por ID. Retorna null si no existe.
   * @return {Object|null}
   */
  function obtenerPorId(producto_id) {
    if (!producto_id) return null;
    const todos = listar(false);
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].producto_id === producto_id) return todos[i];
    }
    return null;
  }

  /**
   * Inserta un nuevo producto y retorna el producto creado.
   * @param {Object} producto {nombre, categoria, activo}
   * @return {Object}
   */
  function crear(producto) {
    const hoja = _hoja();
    const numero = siguienteNumeroId(hoja, COLS.PRODUCTOS.producto_id, CONFIG.PREFIJO_PRODUCTO);
    const id = generarId(CONFIG.PREFIJO_PRODUCTO, numero, CONFIG.PADDING_PRODUCTO);
    const nuevo = {
      producto_id: id,
      nombre: producto.nombre,
      categoria: producto.categoria || 'Otros',
      activo: producto.activo !== false,
    };
    const fila = objetoAFila(nuevo, COLS.PRODUCTOS, HEADERS.PRODUCTOS.length);
    hoja.appendRow(fila);
    return nuevo;
  }

  /**
   * Actualiza un producto existente. Solo modifica los campos provistos.
   * Retorna el producto actualizado o null si no existía.
   */
  function actualizar(producto_id, cambios) {
    const hoja = _hoja();
    const ultima = hoja.getLastRow();
    if (ultima < 2) return null;
    const ancho = HEADERS.PRODUCTOS.length;
    const datos = hoja.getRange(2, 1, ultima - 1, ancho).getValues();
    for (let i = 0; i < datos.length; i++) {
      if (datos[i][COLS.PRODUCTOS.producto_id] === producto_id) {
        const actual = filaAObjeto(datos[i], COLS.PRODUCTOS);
        if (cambios.nombre !== undefined) actual.nombre = cambios.nombre;
        if (cambios.categoria !== undefined) actual.categoria = cambios.categoria;
        if (cambios.activo !== undefined) actual.activo = toBool(cambios.activo);
        const filaNueva = objetoAFila(actual, COLS.PRODUCTOS, ancho);
        hoja.getRange(i + 2, 1, 1, ancho).setValues([filaNueva]);
        return actual;
      }
    }
    return null;
  }

  /**
   * Verifica si existe un producto con ese nombre (case-insensitive).
   * Útil para evitar duplicados.
   */
  function existeNombre(nombre) {
    if (!nombre) return false;
    const norm = nombre.trim().toLowerCase();
    const todos = listar(false);
    for (let i = 0; i < todos.length; i++) {
      if (String(todos[i].nombre || '').trim().toLowerCase() === norm) return true;
    }
    return false;
  }

  return {
    listar: listar,
    obtenerPorId: obtenerPorId,
    crear: crear,
    actualizar: actualizar,
    existeNombre: existeNombre,
  };
})();
