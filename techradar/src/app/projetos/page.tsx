import { StudyProvider } from "@/lib/study/context";
import ProjetosPage from "@/components/study/projetos/page";

export default function ProjetosRoutePage() {
  return (
    <StudyProvider>
      <ProjetosPage />
    </StudyProvider>
  );
}
