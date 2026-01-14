/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** board-list
 */

"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, MoreHorizontal, Plus } from "lucide-react";
import { BoardCard } from "./board-card";
import { useClientT } from "@/lib/i18n-client";
import type { ListType, CardType, LabelType } from "@/types/board";

interface BoardListProps {
  list: ListType;
  cards: CardType[];
  labels: LabelType[];
  onCardClick: (card: CardType) => void;
  onListAction?: (action: string, list: ListType) => void;
  isAddingCard: boolean;
  newCardTitle: string;
  onAddCardClick: (listId: number) => void;
  setNewCardTitle: (val: string) => void;
  onSaveNewCard: () => void;
  onCancelAddCard: () => void;
}

export function BoardList({
  list,
  cards,
  labels,
  onCardClick,
  onListAction,
  isAddingCard,
  newCardTitle,
  onAddCardClick,
  setNewCardTitle,
  onSaveNewCard,
  onCancelAddCard,
}: BoardListProps) {
  const { t } = useClientT("dashboard");
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `list-${list.id}`,
    data: { type: "list", list },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: { type: "list", list },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setSortableRef} style={style} className="w-72 flex-shrink-0">
      <Card className="bg-background max-h-full flex flex-col">
        <div className="p-3 pb-0">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <h2 className="font-semibold text-foreground">{list.title}</h2>
              <span className="text-sm text-muted-foreground">
                ({cards.length})
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onListAction && onListAction("menu", list)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={setDroppableRef}
          className={`p-3 pt-0 overflow-y-auto min-h-[50px] ${
            isOver ? "bg-accent/20 rounded-lg" : ""
          }`}
        >
          <SortableContext
            items={cards.map((c) => `card-${c.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {cards.map((card) => {
              const cardLabel = labels.find((l) => l.id === card.label_id);
              return (
                <BoardCard
                  key={card.id}
                  card={card}
                  label={cardLabel}
                  onClick={() => onCardClick(card)}
                />
              );
            })}
          </SortableContext>

          {isAddingCard ? (
            <div className="mt-2 space-y-2">
              <Textarea
                placeholder={t("list.addCard.placeholder")}
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSaveNewCard();
                  } else if (e.key === "Escape") {
                    onCancelAddCard();
                  }
                }}
                autoFocus
                className="resize-none bg-white"
                rows={2}
              />
              <div className="flex gap-2">
                <Button onClick={onSaveNewCard} size="sm">
                  {t("list.addCard.submit")}
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancelAddCard}>
                  {t("list.addCard.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:bg-accent"
              onClick={() => onAddCardClick(list.id)}
            >
              <Plus className="h-4 w-4" />
              {t("list.addCard.trigger")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
