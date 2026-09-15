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
import { PublicLayoutV2 } from "./public-v2/components/PublicLayoutV2";
import { HomePageV2 } from "./public-v2/pages/HomePageV2";
import { LeistungenPageV2 } from "./public-v2/pages/LeistungenPageV2";
import { ReferenzenPageV2 } from "./public-v2/pages/ReferenzenPageV2";
import { UeberUnsPageV2 } from "./public-v2/pages/UeberUnsPageV2";
import { KontaktPageV2 } from "./public-v2/pages/KontaktPageV2";

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

      {/* Design-Entwurf V2 (angelehnt an das-klimageraet.ch) — separat zum Vergleich,
          nicht von V1 aus verlinkt. Nach Entscheid: eine der beiden Varianten entfernen. */}
      <Route path="v2" element={<PublicLayoutV2 />}>
        <Route index element={<HomePageV2 />} />
        <Route path="leistungen" element={<LeistungenPageV2 />} />
        <Route path="referenzen" element={<ReferenzenPageV2 />} />
        <Route path="ueber-uns" element={<UeberUnsPageV2 />} />
        <Route path="kontakt" element={<KontaktPageV2 />} />
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
