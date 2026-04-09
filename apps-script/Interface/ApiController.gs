/**
 * Interface/ApiController.gs
 * ----------------------------------------------------------------------------
 * Orquestador de endpoints. Cada función `apiXxx` es llamada desde el
 * frontend vía `google.script.run.apiXxx(payload)`.
 *
 * Responsabilidades:
 *   1. Aplicar AuthGuard según el rol requerido
 *   2. Delegar al Service correspondiente
 *   3. Capturar errores y retornar la respuesta estándar {ok, data|error, codigo}
 *
 * NUNCA acceder directo a DAOs desde aquí — siempre vía Services.
 * ----------------------------------------------------------------------------
 */

// =============================================================================
// 1. SESIÓN Y AUTH
// =============================================================================

function apiObtenerSesion() {
  try {
    const u = AuthGuard.obtenerUsuarioActual();
    if (!u) {
      return respuestaError('No autenticado o email no registrado en el sistema', ERR.NO_AUTH);
    }
    return respuestaOk(u);
  } catch (e) {
    return _manejarError(e);
  }
}

// =============================================================================
// 2. INVENTARIO Y KARDEX
// =============================================================================

function apiObtenerInventarioGlobal() {
  try {
    AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN]);
    return respuestaOk(InventarioService.obtenerInventarioGlobal());
  } catch (e) {
    return _manejarError(e);
  }
}

function apiObtenerKardex(payload) {
  try {
    const u = AuthGuard.requireAuth();
    payload = payload || {};

    // Vendedoras solo pueden ver su propio kardex
    if (u.rol === ROLES.VENDEDORA) {
      if (payload.vendedora_id && payload.vendedora_id !== u.vendedora_id) {
        return respuestaError('Solo puedes ver tu propio kardex', ERR.FORBIDDEN);
      }
      payload.vendedora_id = u.vendedora_id;
    }

    if (!payload.vendedora_id) {
      return respuestaError('vendedora_id requerido', ERR.VALIDACION);
    }

    const items = KardexService.obtenerKardex(payload.vendedora_id);
    const resumen = KardexService.obtenerResumenKardex(payload.vendedora_id);
    return respuestaOk({ items: items, resumen: resumen });
  } catch (e) {
    return _manejarError(e);
  }
}

function apiObtenerPrecios(payload) {
  try {
    const u = AuthGuard.requireAuth();
    payload = payload || {};
    // Si no se especifica, vendedoras ven sus propios precios
    let vendedora_id = payload.vendedora_id;
    if (u.rol === ROLES.VENDEDORA) {
      vendedora_id = u.vendedora_id;
    }
    return respuestaOk(PreciosService.obtenerListadoPrecios(vendedora_id));
  } catch (e) {
    return _manejarError(e);
  }
}

// =============================================================================
// 3. TRANSACCIONES
// =============================================================================

function apiRegistrarVenta(payload) {
  try {
    const u = AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.VENDEDORA]);
    const mov = VentasService.registrarVenta(payload, u);
    return respuestaOk(mov);
  } catch (e) {
    return _manejarError(e);
  }
}

function apiRegistrarEntrega(payload) {
  try {
    const u = AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.VENDEDORA]);
    const mov = EntregasService.registrarEntrega(payload, u);
    return respuestaOk(mov);
  } catch (e) {
    return _manejarError(e);
  }
}

function apiRegistrarIngreso(payload) {
  try {
    const u = AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN]);
    const mov = EntregasService.registrarIngreso(payload, u);
    return respuestaOk(mov);
  } catch (e) {
    return _manejarError(e);
  }
}

function apiAjustarStock(payload) {
  try {
    const u = AuthGuard.requireRol([ROLES.SUPERADMIN]);
    const mov = BitacoraService.ajustarStock(payload, u);
    return respuestaOk(mov);
  } catch (e) {
    return _manejarError(e);
  }
}

// =============================================================================
// 4. CATÁLOGO (admin)
// =============================================================================

function apiCrearProducto(payload) {
  try {
    const u = AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN]);
    return respuestaOk(CatalogoService.crearProducto(payload, u));
  } catch (e) {
    return _manejarError(e);
  }
}

function apiEditarProducto(payload) {
  try {
    const u = AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN]);
    return respuestaOk(CatalogoService.editarProducto(payload, u));
  } catch (e) {
    return _manejarError(e);
  }
}

function apiCrearVariante(payload) {
  try {
    const u = AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN]);
    return respuestaOk(CatalogoService.crearVariante(payload, u));
  } catch (e) {
    return _manejarError(e);
  }
}

function apiEditarVariante(payload) {
  try {
    const u = AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN]);
    return respuestaOk(CatalogoService.editarVariante(payload, u));
  } catch (e) {
    return _manejarError(e);
  }
}

function apiListarProductos() {
  try {
    AuthGuard.requireAuth();
    return respuestaOk(CatalogoService.listarProductos());
  } catch (e) {
    return _manejarError(e);
  }
}

function apiListarVariantes(payload) {
  try {
    AuthGuard.requireAuth();
    payload = payload || {};
    return respuestaOk(CatalogoService.listarVariantes(payload.producto_id));
  } catch (e) {
    return _manejarError(e);
  }
}

// =============================================================================
// 5. GESTIÓN DE VENDEDORAS
// =============================================================================

function apiListarVendedoras() {
  try {
    AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN]);
    return respuestaOk(AdminVendedorasService.listarVendedoras());
  } catch (e) {
    return _manejarError(e);
  }
}

function apiCrearVendedora(payload) {
  try {
    const u = AuthGuard.requireRol([ROLES.SUPERADMIN]);
    return respuestaOk(AdminVendedorasService.crearVendedora(payload, u));
  } catch (e) {
    return _manejarError(e);
  }
}

function apiEditarVendedora(payload) {
  try {
    const u = AuthGuard.requireRol([ROLES.SUPERADMIN]);
    return respuestaOk(AdminVendedorasService.editarVendedora(payload, u));
  } catch (e) {
    return _manejarError(e);
  }
}

// =============================================================================
// 6. REPORTES Y DASHBOARD
// =============================================================================

function apiDashboardResumen(payload) {
  try {
    AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN]);
    return respuestaOk(ReportesService.dashboardResumen(payload || {}));
  } catch (e) {
    return _manejarError(e);
  }
}

// =============================================================================
// 7. BITÁCORA
// =============================================================================

function apiBitacoraListar(payload) {
  try {
    AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN]);
    return respuestaOk(BitacoraService.listar(payload || {}));
  } catch (e) {
    return _manejarError(e);
  }
}

// =============================================================================
// 8. CONFIGURACIÓN
// =============================================================================

function apiConfigObtener() {
  try {
    AuthGuard.requireAuth();
    return respuestaOk(ConfigService.obtenerTodo());
  } catch (e) {
    return _manejarError(e);
  }
}

function apiConfigActualizar(payload) {
  try {
    const u = AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN]);
    return respuestaOk(ConfigService.actualizar(payload, u));
  } catch (e) {
    return _manejarError(e);
  }
}

// =============================================================================
// 9. UTILIDADES (superadmin)
// =============================================================================

function apiRecalcularStock() {
  try {
    AuthGuard.requireRol([ROLES.SUPERADMIN]);
    return respuestaOk(ReportesService.recalcularStock());
  } catch (e) {
    return _manejarError(e);
  }
}

function apiExportarBackup() {
  try {
    AuthGuard.requireRol([ROLES.SUPERADMIN, ROLES.ADMIN]);
    return respuestaOk(ReportesService.exportarBackup());
  } catch (e) {
    return _manejarError(e);
  }
}

// =============================================================================
// MANEJO DE ERRORES CENTRALIZADO
// =============================================================================

/**
 * @private
 */
function _manejarError(e) {
  log('ERROR', e.message || String(e), { codigo: e.codigo, stack: e.stack });
  return respuestaError(e.message || 'Error interno', e.codigo || ERR.INTERNO);
}
