import { Redirect } from 'expo-router';

// URL de la versión anterior de la app: la mantenemos para que los links viejos sigan funcionando.
export default function ReservaAntigua() {
  return <Redirect href="/reservas" />;
}
