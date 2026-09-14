import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { InternalApp } from "./InternalApp";
import { PublicLayout } from "./public/components/PublicLayout";
import { HomePage } from "./public/pages/HomePage";
import { LeistungenPage } from "./public/pages/LeistungenPage";
import { ReferenzenPage } from "./public/pages/ReferenzenPage";
import { UeberUnsPage } from "./public/pages/UeberUnsPage";
import { KontaktPage } from "./public/pages/KontaktPage";
import { ImpressumPage } from "./public/pages/ImpressumPage";
import { DatenschutzPage } from "./public/pages/DatenschutzPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="leistungen" element={<LeistungenPage />} />
        <Route path="referenzen" element={<ReferenzenPage />} />
        <Route path="ueber-uns" element={<UeberUnsPage />} />
        <Route path="kontakt" element={<KontaktPage />} />
        <Route path="impressum" element={<ImpressumPage />} />
        <Route path="datenschutz" element={<DatenschutzPage />} />
      </Route>

      <Route
        path="/app/*"
        element={
          <AuthProvider>
            <InternalApp />
          </AuthProvider>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
