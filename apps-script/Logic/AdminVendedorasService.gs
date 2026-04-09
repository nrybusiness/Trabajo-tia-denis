/**
 * Logic/AdminVendedorasService.gs
 * ----------------------------------------------------------------------------
 * Reglas de negocio para gestión de vendedoras. Solo superadmin puede
 * crear, editar o desactivar vendedoras.
 * ----------------------------------------------------------------------------
 */

const AdminVendedorasService = (function () {

  function listarVendedoras() {
    return VendedorasDAO.listar(false);
  }

  function crearVendedora(payload, usuarioActual) {
    validarCamposRequeridos(payload, ['nombre', 'email', 'rol']);

    // Validar rol
    const rolesValidos = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.VENDEDORA];
    if (rolesValidos.indexOf(payload.rol) === -1) {
      throw _err('Rol inválido: ' + payload.rol, ERR.VALIDACION);
    }

    // Solo superadmin puede crear otro superadmin
    if (payload.rol === ROLES.SUPERADMIN && usuarioActual.rol !== ROLES.SUPERADMIN) {
      throw _err('Solo superadmin puede crear superadmin', ERR.FORBIDDEN);
    }

    return VendedorasDAO.crear({
      nombre: payload.nombre,
      email: payload.email,
      rol: payload.rol,
      activo: true,
    });
  }

  function editarVendedora(payload, usuarioActual) {
    validarCamposRequeridos(payload, ['vendedora_id']);

    // No permitir auto-desactivación (evitar quedar sin acceso)
    if (payload.vendedora_id === usuarioActual.vendedora_id && payload.activo === false) {
      throw _err('No puedes desactivar tu propia cuenta', ERR.VALIDACION);
    }

    // Validar rol si viene
    if (payload.rol) {
      const rolesValidos = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.VENDEDORA];
      if (rolesValidos.indexOf(payload.rol) === -1) {
        throw _err('Rol inválido', ERR.VALIDACION);
      }
    }

    const actualizada = VendedorasDAO.actualizar(payload.vendedora_id, {
      nombre: payload.nombre,
      email: payload.email,
      rol: payload.rol,
      activo: payload.activo,
    });

    if (!actualizada) {
      throw _err('Vendedora no encontrada', ERR.VENDEDORA_NO_EXISTE);
    }
    return actualizada;
  }

  function _err(msg, codigo) {
    const e = new Error(msg);
    e.codigo = codigo;
    return e;
  }

  return {
    listarVendedoras: listarVendedoras,
    crearVendedora: crearVendedora,
    editarVendedora: editarVendedora,
  };
})();
