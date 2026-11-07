import { StudyProvider } from "@/lib/study/context";
import LaboratorioPage from "@/components/study/laboratorio/page";

export default function LaboratorioRoutePage() {
  return (
    <StudyProvider>
      <LaboratorioPage />
    </StudyProvider>
  );
}
