/**
 * Interface/AuthGuard.gs
 * ----------------------------------------------------------------------------
 * Captura el usuario actual desde la sesión de Google y valida que tenga
 * el rol necesario para ejecutar un endpoint.
 *
 * Mecanismo: Session.getActiveUser().getEmail() retorna el email del usuario
 * que abrió el WebApp (siempre que el deployment esté configurado como
 * "Ejecutar como: usuario que accede").
 * ----------------------------------------------------------------------------
 */

const AuthGuard = (function () {

  /**
   * Retorna el usuario actualmente autenticado.
   * @return {Object|null} {vendedora_id, nombre, email, rol} o null si no autenticado.
   */
  function obtenerUsuarioActual() {
    let email = '';
    try {
      email = Session.getActiveUser().getEmail();
    } catch (e) {
      try {
        email = Session.getEffectiveUser().getEmail();
      } catch (e2) {
        email = '';
      }
    }
    if (!email) return null;

    const v = VendedorasDAO.obtenerPorEmail(email);
    if (!v) return null;

    return {
      vendedora_id: v.vendedora_id,
      nombre: v.nombre,
      email: v.email,
      rol: v.rol,
    };
  }

  /**
   * Verifica que exista un usuario autenticado. Lanza error si no.
   * @return {Object} usuario actual
   */
  function requireAuth() {
    const u = obtenerUsuarioActual();
    if (!u) {
      const e = new Error('No autenticado o email no autorizado');
      e.codigo = ERR.NO_AUTH;
      throw e;
    }
    return u;
  }

  /**
   * Verifica que el usuario actual tenga uno de los roles permitidos.
   * @param {Array<string>} rolesPermitidos
   * @return {Object} usuario actual
   */
  function requireRol(rolesPermitidos) {
    const u = requireAuth();
    if (rolesPermitidos.indexOf(u.rol) === -1) {
      const e = new Error('Rol insuficiente. Tienes: ' + u.rol + '. Requiere: ' + rolesPermitidos.join(', '));
      e.codigo = ERR.FORBIDDEN;
      throw e;
    }
    return u;
  }

  return {
    obtenerUsuarioActual: obtenerUsuarioActual,
    requireAuth: requireAuth,
    requireRol: requireRol,
  };
})();
