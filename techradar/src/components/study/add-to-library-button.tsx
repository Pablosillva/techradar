"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";

interface AddToLibraryButtonProps {
  itemType: "book" | "audiobook";
  itemId: string;
}

export function AddToLibraryButton({ itemType, itemId }: AddToLibraryButtonProps) {
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");

  const add = async () => {
    setState("adding");
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemType, itemId, status: "to_read" }),
      });
      if (res.ok) {
        setState("added");
      }
    } catch {
      setState("idle");
    }
  };

  return (
    <Button
      size="sm"
      disabled={state !== "idle"}
      onClick={add}
      className="whitespace-nowrap"
    >
      {state === "adding" ? (
        <>
          Adicionando...
        </>
      ) : state === "added" ? (
        <>
          <Check size={14} className="mr-2" />
          Adicionado
        </>
      ) : (
        <>
          <Plus size={14} className="mr-2" />
          Adicionar à biblioteca
        </>
      )}
    </Button>
  );
}
