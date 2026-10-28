import Link from "next/link";
import { MapPin, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSalary, timeAgo } from "@/lib/utils";
import type { JobSummary } from "@/types/api";

interface JobCardProps {
  job: JobSummary;
}

export function JobCard({ job }: JobCardProps) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency);

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base leading-tight">
              <Link
                href={`/vaga/${job.id}`}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                {job.title}
              </Link>
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {job.company}
            </p>
          </div>
          <Badge variant={job.isRemote ? "success" : "secondary"}>
            {job.isRemote ? "Remoto" : "Presencial"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} aria-hidden="true" />
              {job.location}
            </span>
          )}
          {job.postedAt && (
            <span className="flex items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              {timeAgo(job.postedAt)}
            </span>
          )}
          {salary && <span className="font-medium text-green-600 dark:text-green-400">{salary}</span>}
        </div>

        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {job.skills.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{job.skills.length - 5}
              </Badge>
            )}
          </div>
        )}

        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          Ver vaga original
          <ExternalLink size={10} aria-hidden="true" />
        </a>
      </CardContent>
    </Card>
  );
}
