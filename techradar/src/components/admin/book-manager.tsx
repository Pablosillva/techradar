"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X } from "lucide-react";

export interface Book {
  id: string;
  title: string;
  authors: string[];
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  language: string;
  pageCount: number | null;
  publishedAt: Date | null;
  publisher: string | null;
  isFree: boolean;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface BookManagerProps {
  initialBooks: Book[];
}

export function BookManager({ initialBooks }: BookManagerProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string | boolean | number | string[] | null>>({});
  const [message, setMessage] = useState("");

  function startEdit(book: Book) {
    setEditingId(book.id);
    setFormData({
      title: book.title,
      authors: book.authors.join(", "),
      description: book.description ?? "",
      url: book.url,
      language: book.language,
      isFree: book.isFree,
      pageCount: book.pageCount ?? 0,
      publisher: book.publisher ?? "",
      skillSlugs: book.skills.join(","),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({});
  }

  async function handleSave(bookId: string) {
    setMessage("");

    const payload = {
      title: String(formData.title ?? ""),
      authors: String(formData.authors ?? "")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      description: String(formData.description ?? ""),
      url: String(formData.url ?? ""),
      language: String(formData.language ?? "en"),
      isFree: Boolean(formData.isFree),
      pageCount: formData.pageCount ? Number(formData.pageCount) : null,
      publisher: String(formData.publisher ?? ""),
      skillSlugs: String(formData.skillSlugs ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const res = await fetch(`/api/admin/books/${bookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setBooks((prev) => prev.map((b) => (b.id === bookId ? data.data : b)));
      setEditingId(null);
      setMessage("Livro atualizado com sucesso!");
    } else {
      const error = await res.json();
      setMessage(error.error ?? "Erro ao atualizar livro");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {books.map((book) => (
          <Card key={book.id}>
            <CardContent className="py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {book.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {book.authors.join(", ")} • {book.language.toUpperCase()} •{" "}
                    {book.isFree ? "Gratuito" : "Pago"} • {book.pageCount ?? "?"} páginas
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {book.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => (editingId === book.id ? cancelEdit() : startEdit(book))}
                >
                  {editingId === book.id ? <X size={14} /> : <Edit2 size={14} />}
                  {editingId === book.id ? "Cancelar" : "Editar"}
                </Button>
              </div>

              {editingId === book.id && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Título"
                      value={String(formData.title ?? "")}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Input
                      placeholder="Autores (separados por vírgula)"
                      value={String(formData.authors ?? "")}
                      onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                    />
                    <Input
                      placeholder="URL"
                      value={String(formData.url ?? "")}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                    <Input
                      placeholder="Editora"
                      value={String(formData.publisher ?? "")}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    />
                    <Input
                      placeholder="Páginas"
                      type="number"
                      value={formData.pageCount ? String(formData.pageCount) : ""}
                      onChange={(e) => setFormData({ ...formData, pageCount: e.target.value ? Number(e.target.value) : null })}
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
                    <Button size="sm" onClick={() => handleSave(book.id)}>
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
