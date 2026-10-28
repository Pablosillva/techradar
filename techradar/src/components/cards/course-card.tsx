import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CourseSummary } from "@/types/api";

interface CourseCardProps {
  course: CourseSummary;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base leading-tight">
              <Link
                href={`/curso/${course.id}`}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                {course.title}
              </Link>
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {course.provider}
            </p>
          </div>
          <Badge variant={course.isFree ? "success" : "warning"}>
            {course.isFree ? "Gratuito" : "Pago"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {course.level && <span>{course.level}</span>}
          {course.rating && (
            <span className="flex items-center gap-1">
              <Star size={12} className="fill-yellow-400 text-yellow-400" aria-hidden="true" />
              {course.rating.toFixed(1)}
            </span>
          )}
          {!course.isFree && course.price != null && (
            <span className="font-medium text-green-600 dark:text-green-400">
              ${course.price}
            </span>
          )}
        </div>

        {course.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {course.skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {course.skills.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{course.skills.length - 5}
              </Badge>
            )}
          </div>
        )}

        <a
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          Ver curso original
          <ExternalLink size={10} aria-hidden="true" />
        </a>
      </CardContent>
    </Card>
  );
}
