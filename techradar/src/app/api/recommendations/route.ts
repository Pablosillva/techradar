import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateMatchScore, getSourcePopularity } from "@/lib/skills/score";

/**
 * GET /api/recommendations?type=job&id=abc123
 * Retorna recomendações cruzadas baseadas em skills.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json(
      { error: "type e id são obrigatórios" },
      { status: 400 }
    );
  }

  // Busca a entidade de origem e suas skills
  let origin: { id: string; title: string; skills: string[] } | null = null;

  if (type === "job") {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { skills: { include: { skill: true } } },
    });
    if (job) {
      origin = {
        id: job.id,
        title: job.title,
        skills: job.skills.map((s) => s.skill.slug),
      };
    }
  } else if (type === "course") {
    const course = await prisma.course.findUnique({
      where: { id },
      include: { skills: { include: { skill: true } } },
    });
    if (course) {
      origin = {
        id: course.id,
        title: course.title,
        skills: course.skills.map((s) => s.skill.slug),
      };
    }
  } else if (type === "book") {
    const book = await prisma.book.findUnique({
      where: { id },
      include: { skills: { include: { skill: true } } },
    });
    if (book) {
      origin = {
        id: book.id,
        title: book.title,
        skills: book.skills.map((s) => s.skill.slug),
      };
    }
  } else if (type === "audiobook") {
    const audiobook = await prisma.audiobook.findUnique({
      where: { id },
      include: { skills: { include: { skill: true } } },
    });
    if (audiobook) {
      origin = {
        id: audiobook.id,
        title: audiobook.title,
        skills: audiobook.skills.map((s) => s.skill.slug),
      };
    }
  }

  if (!origin) {
    return NextResponse.json(
      { error: "Item não encontrado" },
      { status: 404 }
    );
  }

  // Busca itens relacionados (curso, livro, audiobook) com skills em comum
  const skillIds = await prisma.skill.findMany({
    where: { slug: { in: origin.skills } },
    select: { id: true },
  }).then((s) => s.map((skill) => skill.id));

  const [courses, books, audiobooks] = await Promise.all([
    prisma.course.findMany({
      where: {
        skills: { some: { skillId: { in: skillIds } } },
      },
      include: { skills: { include: { skill: true } } },
      take: 20,
    }),
    prisma.book.findMany({
      where: {
        skills: { some: { skillId: { in: skillIds } } },
      },
      include: { skills: { include: { skill: true } } },
      take: 20,
    }),
    prisma.audiobook.findMany({
      where: {
        skills: { some: { skillId: { in: skillIds } } },
      },
      include: { skills: { include: { skill: true } } },
      take: 20,
    }),
  ]);

  // Calcula scores e ordena
  const scoredCourses = courses
    .map((c) => {
      const targetSkills = c.skills.map((s) => s.skill.slug);
      const match = calculateMatchScore(origin!.skills, targetSkills, getSourcePopularity(c.source));
      return {
        id: c.id,
        title: c.title,
        url: c.url,
        provider: c.provider,
        isFree: c.isFree,
        matchScore: match.score,
        matchedSkills: match.matchedSkills,
        reason: match.reason,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  const scoredBooks = books
    .map((b) => {
      const targetSkills = b.skills.map((s) => s.skill.slug);
      const match = calculateMatchScore(origin!.skills, targetSkills, getSourcePopularity(b.source));
      return {
        id: b.id,
        title: b.title,
        url: b.url,
        authors: b.authors,
        thumbnailUrl: b.thumbnailUrl,
        matchScore: match.score,
        matchedSkills: match.matchedSkills,
        reason: match.reason,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  const scoredAudiobooks = audiobooks
    .map((a) => {
      const targetSkills = a.skills.map((s) => s.skill.slug);
      const match = calculateMatchScore(origin!.skills, targetSkills, getSourcePopularity(a.source));
      return {
        id: a.id,
        title: a.title,
        url: a.url,
        authors: a.authors,
        matchScore: match.score,
        matchedSkills: match.matchedSkills,
        reason: match.reason,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  return NextResponse.json({
    origin: {
      type,
      id: origin.id,
      title: origin.title,
      skills: origin.skills,
    },
    recommendations: {
      courses: scoredCourses,
      books: scoredBooks,
      audiobooks: scoredAudiobooks,
    },
  });
}
