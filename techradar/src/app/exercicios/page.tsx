import { StudyProvider } from "@/lib/study/context";
import ExerciciosPage from "@/components/study/exercicios/page";

export default function ExerciciosRoutePage() {
  return (
    <StudyProvider>
      <ExerciciosPage />
    </StudyProvider>
  );
}
