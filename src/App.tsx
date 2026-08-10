import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PasswordGate } from '@/components/layout/PasswordGate';

import Portal from '@/pages/00-portal';
import DemoHub from '@/pages/00-portal/DemoHub';
import Admin from '@/pages/99-admin';
import ClienteOnboarding from '@/pages/01-cliente-onboarding';
import ClienteCredito from '@/pages/02-cliente-credito';
import { PropertyInputScreen } from '@/pages/02-cliente-propiedad';
import ClienteSimulacion from '@/pages/02-cliente-simulacion';
import ClienteConfirmado from '@/pages/02-cliente-confirmado';
import ClienteDocumentos from '@/pages/03-cliente-documentos';
import EjecutivoCockpit from '@/pages/04-ejecutivo-cockpit';
import EjecutivoAudio from '@/pages/05-ejecutivo-audio';
import BackofficeDashboard from '@/pages/06-backoffice-dashboard';
import JefaturaDashboard from '@/pages/06b-jefatura-dashboard';
import Operaciones from '@/pages/06c-operaciones';
import GovernanceDashboard from '@/pages/06d-governance';
import InmobiliariaPortal from '@/pages/07-inmobiliaria-portal';
import Comparador from '@/pages/08-comparador';
import DemoFlow from '@/pages/09-demo-flow';
import TestPage from '@/pages/_test';

// Visión Daniela — vistas nuevas
import ClienteSeguimiento from '@/pages/10-cliente-seguimiento/ClienteSeguimiento';
import ClienteMisDocumentos from '@/pages/10-cliente-seguimiento/ClienteMisDocumentos';
import VendedorPortal from '@/pages/11-vendedor-portal/VendedorPortal';
import InmobiliariaProyectos from '@/pages/12-inmobiliaria-proyectos/InmobiliariaProyectos';
import SimuladorImpacto from '@/pages/13-simulador-impacto';
import HubInmueble from '@/pages/14-hub-inmueble';
import { BRAND } from '@/lib/brand';

export default function App() {
  return (
    <PasswordGate>
      <Routes>
      <Route element={<AppShell />}>
        {/* Entry point directo a la vista principal. */}
        {/* El portal con catálogo completo queda en /portal. */}
        <Route index element={<DemoHub />} />
        <Route path="portal" element={<Portal />} />

        {/* Flujo conversacional con {BRAND.assistantName} — extra-agregado */}
        <Route path="cliente/simulacion-pre" element={<ClienteOnboarding />} />
        <Route path="cliente" element={<Navigate to="/cliente/seguimiento" replace />} />
        <Route path="cliente/credito" element={<ClienteCredito />} />
        <Route path="cliente/propiedad" element={<PropertyInputScreen />} />
        <Route path="cliente/documentos" element={<ClienteDocumentos />} />
        <Route path="cliente/simulacion" element={<ClienteSimulacion />} />
        <Route path="cliente/confirmado" element={<ClienteConfirmado />} />

        {/* Visión Daniela — nuevas vistas */}
        <Route path="cliente/seguimiento" element={<ClienteSeguimiento />} />
        <Route path="cliente/mis-documentos" element={<ClienteMisDocumentos />} />
        <Route path="vendedor" element={<VendedorPortal />} />
        <Route path="inmobiliaria/proyectos" element={<InmobiliariaProyectos />} />

        <Route path="ejecutivo" element={<EjecutivoCockpit />} />
        <Route path="ejecutivo/audio" element={<EjecutivoAudio />} />
        <Route path="ejecutivo/simulador-impacto" element={<SimuladorImpacto />} />
        <Route path="cliente/mi-inmueble" element={<HubInmueble />} />
        <Route path="ejecutivo/inmueble" element={<HubInmueble />} />

        <Route path="backoffice" element={<BackofficeDashboard />} />
        <Route path="jefatura" element={<JefaturaDashboard />} />
        <Route path="operaciones" element={<Operaciones />} />
        <Route path="governance" element={<GovernanceDashboard />} />
        <Route path="inmobiliaria" element={<InmobiliariaPortal />} />
        <Route path="comparador" element={<Comparador />} />

        <Route path="demo" element={<DemoFlow />} />
        <Route path="test" element={<TestPage />} />
        <Route path="admin" element={<Admin />} />

        <Route path="*" element={<Navigate to="/cliente/seguimiento" replace />} />
      </Route>
      </Routes>
    </PasswordGate>
  );
}
