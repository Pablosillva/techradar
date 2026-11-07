import { StudyProvider } from "@/lib/study/context";
import EvolucaoPage from "@/components/study/evolucao/page";

export default function EvolucaoRoutePage() {
  return (
    <StudyProvider>
      <EvolucaoPage />
    </StudyProvider>
  );
}
