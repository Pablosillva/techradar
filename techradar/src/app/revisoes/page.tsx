import { StudyProvider } from "@/lib/study/context";
import RevisoesPage from "@/components/study/revisoes/page";

export default function RevisoesRoutePage() {
  return (
    <StudyProvider>
      <RevisoesPage />
    </StudyProvider>
  );
}
