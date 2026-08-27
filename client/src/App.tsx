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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading, setupRequired } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
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
        <Route path="einstellungen" element={<SettingsPage />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={user ? "/" : setupRequired ? "/login" : "/login"} replace />}
      />
    </Routes>
  );
}
