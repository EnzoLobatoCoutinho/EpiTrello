/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** board-card
 */

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Calendar } from "lucide-react";
import type { CardType, LabelType } from "@/types/board";

interface BoardCardProps {
  card: CardType;
  label?: LabelType;
  onClick: () => void;
}

export function BoardCard({ card, label, onClick }: BoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `card-${card.id}`,
    data: { type: "card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab p-3 transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <h3 className="mb-2 font-medium text-foreground">{card.title}</h3>

      <div className="mb-2 flex flex-wrap gap-2">
        {label && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 text-xs"
            style={{ backgroundColor: label.color, color: "white" }}
          >
            <Tag className="h-3 w-3" />
            {label.name}
          </Badge>
        )}

        {card.start_date && card.due_date ? (
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            {`${new Date(card.start_date).toLocaleDateString("fr-FR")} → ${new Date(
              card.due_date
            ).toLocaleDateString("fr-FR")}`}
          </Badge>
        ) : (
          <>
            {card.start_date && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {new Date(card.start_date).toLocaleDateString("fr-FR")}
              </Badge>
            )}
            {card.due_date && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {new Date(card.due_date).toLocaleDateString("fr-FR")}
              </Badge>
            )}
          </>
        )}
      </div>

      {card.description && <p className="text-sm text-muted-foreground">{card.description}</p>}
    </Card>
  );
}
