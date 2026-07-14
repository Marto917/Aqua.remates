/** Mensajes de error de auth seguros para mostrar a clientes (sin detalles técnicos). */
export function customerAuthErrorMessage(code: string | null | undefined): string {
  switch (code) {
    case "StaffGoogle":
      return "Esta cuenta es del equipo interno. Usá el acceso de administración.";
    case "AccessDenied":
      return "No pudimos ingresar con esa cuenta de Google. Probá con otra o usá tu email.";
    case "OAuthAccountNotLinked":
    case "OAuthCallback":
    case "OAuthSignin":
    case "Callback":
    case "Configuration":
    case "Default":
    default:
      if (!code) return "No pudimos completar el ingreso. Intentá de nuevo.";
      return "No pudimos conectar con Google. Probá de nuevo o ingresá con tu email y contraseña.";
  }
}
