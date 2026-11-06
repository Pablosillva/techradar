import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ConteudoPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/entrar");
  }

  // Busca todos os conteúdos do usuário em todas as trilhas
  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: session.user.id, isArchived: false },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          contents: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  // Achata todos os conteúdos com referência ao item e trilha
  const todosConteudos = roadmaps.flatMap((roadmap) =>
    roadmap.items.flatMap((item) =>
      item.contents.map((content) => ({
        id: content.id,
        title: content.title,
        type: content.type,
        content: content.content,
        url: content.url,
        order: content.order,
        itemId: item.id,
        itemTitle: item.title,
        itemStatus: item.status,
        roadmapId: roadmap.id,
        roadmapTitle: roadmap.title,
        roadmapLevel: roadmap.level,
        roadmapColor: roadmap.color,
      }))
    )
  );

  if (roadmaps.length === 0 && todosConteudos.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
            <span className="text-2xl">📄</span>
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
              Conteúdo de Estudo
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
              Meus Conteúdos
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Gerencie todos os conteúdos teóricos e links oficiais de suas
              trilhas de estudo em um só lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {roadmaps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-transparent p-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
              <span className="text-4xl">📄</span>
            </span>
            <h2 className="mt-4 text-lg font-semibold text-white">
              Nenhum conteúdo ainda
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-400">
              Crie uma trilha e adicione itens de estudo com conteúdo teórico ou
              links oficiais para começar a organizar seus materiais aqui.
            </p>
          </div>
        ) : (
          roadmaps.map((roadmap) => {
            const itensComConteudo = roadmap.items.filter(
              (item) => item.contents.length > 0
            );

            if (itensComConteudo.length === 0) return null;

            return (
              <div key={roadmap.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="border-b border-white/[0.05] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                      {roadmap.title}
                    </span>
                    <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: roadmap.color ?? "#22d3ee" }} aria-hidden="true" />
                    <span className="text-[10px] text-slate-500">
                      {itensComConteudo.length} item(ns) com conteúdo
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {itensComConteudo.map((item) => (
                    <div key={item.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-200 truncate" title={item.title}>
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              {item.status === "COMPLETED" ? "Concluído" : item.status === "IN_PROGRESS" ? "Em andamento" : item.status === "NEEDS_REVIEW" ? "Revisar" : "Não iniciado"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-3">
                        {item.contents.map((content) => (
                          <div key={content.id} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-400/10 text-violet-300">
                                  <span className="text-sm">📄</span>
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-sm font-medium text-slate-200 truncate" title={content.title}>
                                      {content.title}
                                    </h4>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{content.type}</span>
                                  </div>
                                  {content.content && (
                                    <div className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-400 max-h-48 overflow-y-auto pr-2">
                                      {content.content}
                                    </div>
                                  )}
                                  {content.url && (
                                    <div className="mt-3 flex items-center gap-2">
                                      <a
                                        href={content.url}
                                        target="_blank"
                                        rel="noopener noreferrer nofollow"
                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 transition-colors hover:text-cyan-200"
                                      >
                                        Abrir link oficial
                                        <span className="text-xs">↗</span>
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {todosConteudos.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 bg-transparent p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
            <span className="text-4xl">📄</span>
          </span>
          <h2 className="mt-4 text-lg font-semibold text-white">
            Nenhum conteúdo cadastrado
          </h2>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-400">
            Adicione conteúdos teóricos ou links oficiais aos itens de suas
            trilhas para visualizá-los aqui.
          </p>
        </div>
      )}
    </div>
  );
}
