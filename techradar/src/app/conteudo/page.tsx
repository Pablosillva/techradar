import { StudyProvider } from "@/lib/study/context";
import ContentPage from "@/components/study/content-page";

export default function ConteudoPage() {
  return (
    <StudyProvider>
      <ContentPage />
    </StudyProvider>
  );
}
