"use client";

import { useCallback, useEffect, useState } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Connection, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";

interface MindMapCanvasProps {
  mapId: string;
  title: string;
  topic?: string | null;
}

export function MindMapCanvas({ mapId, title, topic }: MindMapCanvasProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const initialNodes: Node[] = [
    {
      id: "root",
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: topic ?? title },
    },
  ];
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => [
        ...eds,
        {
          id: `edge-${Date.now()}`,
          source: params.source ?? "",
          target: params.target ?? "",
          animated: true,
        },
      ]);
    },
    [setEdges]
  );

  const addBranch = () => {
    const id = `node-${Date.now()}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "default",
        position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
        data: { label: "Novo tópico" },
      },
    ]);
  };

  // Persiste nós/arestas no backend
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/mindmaps/${mapId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, nodes, edges }),
      }).catch(() => {
        // falhas de persistência não devem derrubar o canvas
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [mapId, title, nodes, edges]);

  if (!mounted) {
    return (
      <div className="h-[70vh] w-full rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900" />
    );
  }

  return (
    <div>
      <div style={{ height: "70vh", width: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => setNodes((nds) => nds.map((n, i) => ({ ...n, ...changes[i] })))}
          onEdgesChange={(changes) => setEdges((eds) => eds.map((e, i) => ({ ...e, ...changes[i] })))}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      <button
        onClick={addBranch}
        className="mt-4 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Adicionar ramo
      </button>
    </div>
  );
}
