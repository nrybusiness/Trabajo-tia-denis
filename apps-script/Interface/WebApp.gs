/**
 * Interface/WebApp.gs
 * ----------------------------------------------------------------------------
 * Punto de entrada HTTP del WebApp. Sirve el HTML del ADS al navegador.
 *
 * Despliegue:
 *   Implementar → Nueva implementación → Aplicación web
 *     - Ejecutar como: Usuario que accede
 *     - Quién tiene acceso: Cualquiera con cuenta Google
 * ----------------------------------------------------------------------------
 */

/**
 * Endpoint GET principal. Sirve index.html con includes de CSS/JS.
 */
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  const html = template.evaluate()
    .setTitle('INFINITY — Sistema de Inventario')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return html;
}

/**
 * Helper para incluir templates HTML dentro de otros (CSS, JS parciales).
 * Uso desde HTML: <?!= include('styles') ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
