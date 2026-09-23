import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { LoginPage } from "./pages/LoginPage";
import { Layout } from "./components/Layout";
import { LeadsPage } from "./pages/LeadsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { DevicesPage } from "./pages/DevicesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { QuotesPage } from "./pages/QuotesPage";
import { QuoteDetailPage } from "./pages/QuoteDetailPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { InvoicesPage } from "./pages/InvoicesPage";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GemeindeAnforderungenPage } from "./pages/GemeindeAnforderungenPage";
import { PageTextsPage } from "./pages/PageTextsPage";
import { BookingPage } from "./pages/BookingPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/app/login" replace />;
  return <>{children}</>;
}

// Wird über <Route path="/app/*" element={<InternalApp />} /> gemountet — alle Pfade
// hier sind relativ zu "/app" (React Router löst das über den "*"-Match automatisch auf).
export function InternalApp() {
  const { user, loading, setupRequired } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route
        path="login"
        element={user ? <Navigate to="/app" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="kunden" element={<CustomersPage />} />
        <Route path="kunden/:id" element={<CustomerDetailPage />} />
        <Route path="geraete" element={<DevicesPage />} />
        <Route path="angebote" element={<QuotesPage />} />
        <Route path="angebote/:id" element={<QuoteDetailPage />} />
        <Route path="auftraege" element={<OrdersPage />} />
        <Route path="auftraege/:id" element={<OrderDetailPage />} />
        <Route path="rechnungen" element={<InvoicesPage />} />
        <Route path="rechnungen/:id" element={<InvoiceDetailPage />} />
        <Route path="gemeinde-anforderungen" element={<GemeindeAnforderungenPage />} />
        <Route path="webseite-texte" element={<PageTextsPage />} />
        <Route path="termine" element={<BookingPage />} />
        <Route path="einstellungen" element={<SettingsPage />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={user ? "/app" : setupRequired ? "/app/login" : "/app/login"} replace />}
      />
    </Routes>
  );
}
