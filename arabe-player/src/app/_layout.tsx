import { Component, type ComponentType, type ReactNode } from 'react';

import { ErrorScreen } from '@/components/error-screen';
import { installGlobalErrorHandlers, logError } from '@/lib/error-log';

// 1) Instalar el detector antes que cualquier otra cosa.
installGlobalErrorHandlers();

// 2) Cargar la app "a mano": si un módulo nativo falla al importarse
//    (la causa típica de que la app se cierre al abrir), lo capturamos y lo mostramos.
let Root: ComponentType | null = null;
try {
  Root = require('../components/app-root').default;
} catch (e) {
  logError('arranque (import)', e, true);
}

// 3) Si algo falla al dibujar pantallas, mostrar el error en vez de cerrar.
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    logError('render', error, true);
  }
  render() {
    if (this.state.failed) {
      return <ErrorScreen title="La app falló al abrir" onClose={() => this.setState({ failed: false })} />;
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  if (!Root) return <ErrorScreen title="La app falló al arrancar" />;
  return (
    <Boundary>
      <Root />
    </Boundary>
  );
}
