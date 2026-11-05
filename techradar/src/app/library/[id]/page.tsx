import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SecurePdfReader } from "@/components/study/secure-pdf-reader";
import { SecureAudioPlayer } from "@/components/study/secure-audio-player";

export default async function LibraryReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const item = await prisma.libraryItem.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!item) {
    notFound();
  }

  if (!item.fileUrl) {
    notFound();
  }

  if (item.itemType === "pdf") {
    return (
      <SecurePdfReader
        fileUrl={item.fileUrl}
        libraryId={item.id}
        title={item.title ?? "PDF"}
        currentPage={item.currentPage}
        totalPages={item.totalPages}
      />
    );
  }

  if (item.itemType === "audiobook") {
    return (
      <SecureAudioPlayer
        fileUrl={item.fileUrl}
        libraryId={item.id}
        title={item.title ?? "Audiobook"}
        durationSec={item.durationSec}
        positionSec={item.positionSec}
      />
    );
  }

  notFound();
}
