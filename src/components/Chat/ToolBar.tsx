import React from "react";
import { Globe, BrainCircuit, MapPin, Eye, Database, Mic, ImagePlus, PenTool } from "lucide-react";
import { ToolState } from "../../types";
import { IconButton } from "../ui/IconButton";
import { Tooltip } from "../ui/Tooltip";

interface ToolBarProps {
  tools: ToolState;
  onToggleTool: (tool: keyof ToolState) => void;
}

export function ToolBar({ tools, onToggleTool }: ToolBarProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-transparent">
      <Tooltip content="Busca Web">
        <IconButton
          icon={Globe}
          size="sm"
          active={tools.web_search}
          onClick={() => onToggleTool("web_search")}
        />
      </Tooltip>

      <Tooltip content="Pensamento Estendido">
        <IconButton
          icon={BrainCircuit}
          size="sm"
          active={tools.extended_thinking}
          onClick={() => onToggleTool("extended_thinking")}
        />
      </Tooltip>

      <Tooltip content="GPS / Localização">
        <IconButton
          icon={MapPin}
          size="sm"
          active={tools.maps}
          onClick={() => onToggleTool("maps")}
        />
      </Tooltip>

      <Tooltip content="Visão (Upload de Imagem)">
        <IconButton
          icon={Eye}
          size="sm"
          active={tools.vision}
          onClick={() => onToggleTool("vision")}
        />
      </Tooltip>

      <Tooltip content="Memórias">
        <IconButton
          icon={Database}
          size="sm"
          active={tools.memories}
          onClick={() => onToggleTool("memories")}
        />
      </Tooltip>

      <Tooltip content="Geração de Imagem">
        <IconButton
          icon={ImagePlus}
          size="sm"
          active={tools.image_generation}
          onClick={() => onToggleTool("image_generation")}
        />
      </Tooltip>

      <Tooltip content="Canvas">
        <IconButton
          icon={PenTool}
          size="sm"
          active={tools.canvas}
          onClick={() => onToggleTool("canvas")}
        />
      </Tooltip>

      <Tooltip content="Voz">
        <IconButton
          icon={Mic}
          size="sm"
          active={tools.voice}
          onClick={() => onToggleTool("voice")}
        />
      </Tooltip>
    </div>
  );
}
