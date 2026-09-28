/**
 * Reinicio de la demostración.
 *
 * El recorrido del usuario se guarda en el navegador para que no se pierda al
 * recargar. El efecto secundario es que una demostración empieza donde quedó
 * la anterior: con documentos ya subidos y reparos ya resueltos. Esto lo deja
 * como recién instalado, sin tocar la identidad de la institución ni el
 * logotipo cargado desde /admin.
 */

/** Claves de estado del recorrido. La identidad vive en otras, con prefijo theme:. */
const CLAVES_RECORRIDO = [
  'operacion-cliente',
  'estado-demostracion',
  'operacion-post-aprobacion',
  'hipotecia-docs-store',
];

export function reiniciarDemostracion(): void {
  CLAVES_RECORRIDO.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* sin almacenamiento disponible */
    }
  });
}

/**
 * Reinicia y vuelve a cargar, conservando la institución de la URL.
 *
 * La recarga es necesaria: los stores leen su estado inicial una sola vez, al
 * arrancar, de modo que borrar las claves sin recargar deja la pantalla
 * mostrando el recorrido anterior.
 */
export function reiniciarYRecargar(destino = '/'): void {
  reiniciarDemostracion();
  const params = new URLSearchParams(window.location.search);
  const query = params.toString();
  window.location.href = `${destino}${query ? `?${query}` : ''}`;
}
