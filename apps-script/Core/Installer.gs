/**
 * Core/Installer.gs
 * ----------------------------------------------------------------------------
 * Función de instalación inicial del sistema. Crea las 6 hojas con sus
 * headers correctos y carga los datos seed (vendedoras, config).
 *
 * EJECUTAR UNA SOLA VEZ tras pegar el código en el editor de Apps Script:
 *   1. Editar CONFIG.SHEET_ID en Core/Config.gs (o vincular el script al Sheet)
 *   2. Seleccionar la función `instalarSistema` en el desplegable
 *   3. Click en ▶ Ejecutar
 *   4. Aceptar permisos cuando los pida
 * ----------------------------------------------------------------------------
 */

/**
 * Crea las 6 hojas con headers y datos seed. Idempotente: si las hojas
 * ya existen, no las borra ni duplica datos.
 */
function instalarSistema() {
  const ss = obtenerSpreadsheet();
  Logger.log('Instalando sistema en: ' + ss.getName());

  _crearHojaSiNoExiste(ss, HOJAS.PRODUCTOS, HEADERS.PRODUCTOS);
  _crearHojaSiNoExiste(ss, HOJAS.VARIANTES, HEADERS.VARIANTES);
  _crearHojaSiNoExiste(ss, HOJAS.VENDEDORAS, HEADERS.VENDEDORAS);
  _crearHojaSiNoExiste(ss, HOJAS.STOCK, HEADERS.STOCK);
  _crearHojaSiNoExiste(ss, HOJAS.MOVIMIENTOS, HEADERS.MOVIMIENTOS);
  _crearHojaSiNoExiste(ss, HOJAS.CONFIG, HEADERS.CONFIG);

  _seedVendedoras();
  _seedConfig();

  // Eliminar Hoja1 por defecto si existe y está vacía
  const hoja1 = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (hoja1 && ss.getSheets().length > 1 && hoja1.getLastRow() <= 1) {
    ss.deleteSheet(hoja1);
  }

  Logger.log('✓ Instalación completada');
  return { ok: true, mensaje: 'Sistema instalado correctamente' };
}

/**
 * @private
 */
function _crearHojaSiNoExiste(ss, nombre, headers) {
  let hoja = ss.getSheetByName(nombre);
  if (!hoja) {
    hoja = ss.insertSheet(nombre);
    Logger.log('  + Hoja creada: ' + nombre);
  }
  // Asegurar headers en fila 1
  const actuales = hoja.getRange(1, 1, 1, headers.length).getValues()[0];
  let necesitaHeaders = false;
  for (let i = 0; i < headers.length; i++) {
    if (actuales[i] !== headers[i]) {
      necesitaHeaders = true;
      break;
    }
  }
  if (necesitaHeaders) {
    hoja.getRange(1, 1, 1, headers.length).setValues([headers]);
    hoja.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f0f0f0');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

/**
 * @private
 * Carga vendedoras seed solo si la hoja está vacía.
 */
function _seedVendedoras() {
  const existentes = VendedorasDAO.listar(false);
  if (existentes.length > 0) {
    Logger.log('  · Vendedoras ya tiene datos, skip seed');
    return;
  }
  const seed = [
    { vendedora_id: 'V00', nombre: 'Desarrollador', email: 'superadmin@placeholder.com', rol: ROLES.SUPERADMIN, activo: true },
    { vendedora_id: 'V01', nombre: 'Lorena', email: 'lorena@placeholder.com', rol: ROLES.ADMIN, activo: true },
    { vendedora_id: 'V02', nombre: 'Nataly', email: 'nataly@placeholder.com', rol: ROLES.VENDEDORA, activo: true },
    { vendedora_id: 'V03', nombre: 'Carolina', email: 'carolina@placeholder.com', rol: ROLES.VENDEDORA, activo: true },
  ];
  const hoja = obtenerHoja(HOJAS.VENDEDORAS);
  const ancho = HEADERS.VENDEDORAS.length;
  const filas = seed.map(function (v) {
    return objetoAFila(v, COLS.VENDEDORAS, ancho);
  });
  hoja.getRange(2, 1, filas.length, ancho).setValues(filas);
  Logger.log('  + Vendedoras seed cargadas (' + seed.length + ')');
}

/**
 * @private
 */
function _seedConfig() {
  const existentes = ConfigDAO.listar();
  if (existentes.length > 0) {
    Logger.log('  · Config ya tiene datos, skip seed');
    return;
  }
  ConfigDAO.establecer(CONFIG_KEYS.MONEDA, 'COP', 'Moneda del sistema');
  ConfigDAO.establecer(CONFIG_KEYS.TIMEZONE, 'America/Bogota', 'Zona horaria');
  ConfigDAO.establecer(CONFIG_KEYS.VERSION_SCHEMA, '1.0', 'Versión del schema');
  ConfigDAO.establecer(CONFIG_KEYS.STOCK_BAJO_UMBRAL, '2', 'Unidades para alerta de stock bajo');
  ConfigDAO.establecer(CONFIG_KEYS.PERMITIR_STOCK_NEGATIVO, 'false', 'Si true, permite ventas sin stock');
  Logger.log('  + Config seed cargada');
}
