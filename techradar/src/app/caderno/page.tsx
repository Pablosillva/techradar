import { StudyProvider } from "@/lib/study/context";
import CadernoPage from "@/components/study/caderno/page";

export default function ConteudoCadernoPage() {
  return (
    <StudyProvider>
      <CadernoPage />
    </StudyProvider>
  );
}
