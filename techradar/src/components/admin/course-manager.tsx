"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X } from "lucide-react";

export interface Course {
  id: string;
  title: string;
  provider: string;
  description: string;
  url: string;
  thumbnailUrl: string | null;
  language: string;
  isFree: boolean;
  price: number | null;
  currency: string | null;
  level: string | null;
  duration: string | null;
  rating: number | null;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CourseManagerProps {
  initialCourses: Course[];
}

export function CourseManager({ initialCourses }: CourseManagerProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string | boolean | number | null>>({});
  const [message, setMessage] = useState("");

  function startEdit(course: Course) {
    setEditingId(course.id);
    setFormData({
      title: course.title,
      provider: course.provider,
      description: course.description ?? "",
      url: course.url,
      language: course.language,
      isFree: course.isFree,
      price: course.price,
      level: course.level ?? "",
      duration: course.duration ?? "",
      rating: course.rating ?? 0,
      skillSlugs: course.skills.join(","),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({});
  }

  async function handleSave(courseId: string) {
    setMessage("");

    const payload = {
      title: String(formData.title ?? ""),
      provider: String(formData.provider ?? ""),
      description: String(formData.description ?? ""),
      url: String(formData.url ?? ""),
      language: String(formData.language ?? "en"),
      isFree: Boolean(formData.isFree),
      price: formData.price ? Number(formData.price) : null,
      level: String(formData.level ?? ""),
      duration: String(formData.duration ?? ""),
      rating: formData.rating ? Number(formData.rating) : null,
      skillSlugs: String(formData.skillSlugs ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setCourses((prev) => prev.map((c) => (c.id === courseId ? data.data : c)));
      setEditingId(null);
      setMessage("Curso atualizado com sucesso!");
    } else {
      const error = await res.json();
      setMessage(error.error ?? "Erro ao atualizar curso");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardContent className="py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {course.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {course.provider} • {course.language.toUpperCase()} •{" "}
                    {course.isFree ? "Gratuito" : `$${course.price ?? ""}`} • Nível:{" "}
                    {course.level || "N/A"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {course.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => (editingId === course.id ? cancelEdit() : startEdit(course))}
                >
                  {editingId === course.id ? <X size={14} /> : <Edit2 size={14} />}
                  {editingId === course.id ? "Cancelar" : "Editar"}
                </Button>
              </div>

              {editingId === course.id && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Título"
                      value={String(formData.title ?? "")}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Input
                      placeholder="Provider"
                      value={String(formData.provider ?? "")}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    />
                    <Input
                      placeholder="URL"
                      value={String(formData.url ?? "")}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                    <Input
                      placeholder="Nível (beginner/intermediate/advanced)"
                      value={String(formData.level ?? "")}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    />
                    <Input
                      placeholder="Preço (0 se gratuito)"
                      type="number"
                      value={formData.price ? String(formData.price) : ""}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value ? Number(e.target.value) : null })}
                    />
                    <Input
                      placeholder="Duration (ex: 8h)"
                      value={String(formData.duration ?? "")}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.isFree)}
                        onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Gratuito
                    </label>
                    <Button size="sm" onClick={() => handleSave(course.id)}>
                      <Save size={14} className="mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
    </div>
  );
}
