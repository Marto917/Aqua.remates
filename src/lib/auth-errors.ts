/** Mensajes de error de auth seguros para mostrar a clientes (sin detalles técnicos). */
export function customerAuthErrorMessage(code: string | null | undefined): string {
  switch (code) {
    case "StaffGoogle":
      return "Esta cuenta es del equipo interno. Usá el acceso de administración.";
    case "AccessDenied":
      return "No pudimos ingresar con esa cuenta de Google. Probá con otra o usá tu email.";
    case "OAuthAccountNotLinked":
      return "Ese email ya tiene cuenta. Ingresá con tu contraseña o usá el mismo método de siempre.";
    case "OAuthCallback":
      return "Google volvió con un error de conexión. Probá de nuevo desde www.aquaremates.com.ar.";
    case "OAuthSignin":
      return "No se pudo iniciar el ingreso con Google. Intentá de nuevo en unos segundos.";
    case "Callback":
      return "Falló el regreso desde Google. Cerrá la pestaña e intentá otra vez.";
    case "Configuration":
      return "Google no está bien configurado en el servidor. Avisá al administrador.";
    case "Default":
    default:
      if (!code) return "No pudimos completar el ingreso. Intentá de nuevo.";
      return "No pudimos conectar con Google. Probá de nuevo o ingresá con tu email y contraseña.";
  }
}
