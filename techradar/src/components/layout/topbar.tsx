"use client";

import { Search, Bell, User as UserIcon, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function Topbar() {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 border-b border-gray-800 bg-[#0a0a0f]/90 backdrop-blur-md"
    >
      <div className="flex items-center gap-4">
        <button
          className="rounded-md p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors md:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative w-full max-w-md">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Search className="w-4 h-4" />
          </div>
          <Input
            type="search"
            placeholder="Buscar aulas, tecnologias, projetos, tarefas..."
            className="pl-10 pr-4 h-10 rounded-full bg-gray-900 border-gray-700 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-1 ring-[#0a0a0f]" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
          <div className="hidden md:flex flex-col items-end text-right">
            <p className="text-sm font-medium text-white">Pablo Silva</p>
            <p className="text-xs text-gray-500">Em transição • Full Stack</p>
          </div>
          <button className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold ml-2 hover:scale-105 transition-transform">
            <UserIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
