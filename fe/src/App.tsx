import React from 'react';
import { TicketingProvider, useTicketing } from './context/TicketingStore';
import { Shell } from './components/layout/Shell';
import { EventHero } from './components/views/1-Landing/EventHero';
import { AuthModal } from './components/views/2-Auth/AuthModal';
import { InteractiveGrid } from './components/views/3-SeatMap/InteractiveGrid';
import { SandboxQRIS } from './components/views/4-Checkout/SandboxQRIS';
import { DigitalPass } from './components/views/5-TicketPass/DigitalPass';
import { CameraScannerMock } from './components/views/6-GateScanner/CameraScannerMock';
import { AttendeeTable } from './components/views/7-Admin/AttendeeTable';
import { ToastContainer } from './components/common/ToastContainer';

const MainContent: React.FC = () => {
  const { activeTab, currentUser } = useTicketing();
  const role = currentUser?.role || 'VISITOR';

  return (
    <Shell>
      {activeTab === 'landing' && <EventHero />}

      {/* VISITOR ONLY VIEWS */}
      {activeTab !== 'landing' && role === 'VISITOR' && (
        <>
          {(activeTab === 'seatmap' || activeTab === 'scanner' || activeTab === 'admin') && <InteractiveGrid />}
          {activeTab === 'checkout' && <SandboxQRIS />}
          {activeTab === 'tickets' && <DigitalPass />}
        </>
      )}

      {/* GATE OFFICER ONLY VIEW */}
      {activeTab !== 'landing' && role === 'GATE_OFFICER' && <CameraScannerMock />}

      {/* PANITIA ADMIN ONLY VIEW */}
      {activeTab !== 'landing' && role === 'ADMIN' && <AttendeeTable />}

      <AuthModal />
      <ToastContainer />
    </Shell>
  );
};

export const App: React.FC = () => {
  return (
    <TicketingProvider>
      <MainContent />
    </TicketingProvider>
  );
};

export default App;
