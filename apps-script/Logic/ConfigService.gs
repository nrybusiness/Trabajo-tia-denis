/**
 * Logic/ConfigService.gs
 * ----------------------------------------------------------------------------
 * Wrapper de negocio sobre ConfigDAO. Aplica restricciones de rol y
 * valida claves antes de escribir.
 * ----------------------------------------------------------------------------
 */

const ConfigService = (function () {

  // Claves que el admin puede modificar (las demás son solo superadmin)
  const CLAVES_ADMIN = [CONFIG_KEYS.STOCK_BAJO_UMBRAL];

  function obtenerTodo() {
    return ConfigDAO.listar();
  }

  function actualizar(payload, usuarioActual) {
    validarCamposRequeridos(payload, ['clave', 'valor']);

    if (usuarioActual.rol === ROLES.VENDEDORA) {
      throw _err('Las vendedoras no pueden modificar la configuración', ERR.FORBIDDEN);
    }

    if (usuarioActual.rol === ROLES.ADMIN && CLAVES_ADMIN.indexOf(payload.clave) === -1) {
      throw _err('Solo superadmin puede modificar esta clave: ' + payload.clave, ERR.FORBIDDEN);
    }

    ConfigDAO.establecer(payload.clave, payload.valor, payload.descripcion);
    return { clave: payload.clave, valor: payload.valor };
  }

  function _err(msg, codigo) {
    const e = new Error(msg);
    e.codigo = codigo;
    return e;
  }

  return {
    obtenerTodo: obtenerTodo,
    actualizar: actualizar,
  };
})();
