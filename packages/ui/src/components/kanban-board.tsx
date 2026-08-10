"use client";

import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export interface KanbanColumn {
  id: string;
  title: string;
  className?: string;
}

export interface KanbanBoardProps<T> {
  items: T[];
  columns: KanbanColumn[];
  getColumnId: (item: T) => string;
  onCardDrop: (itemId: string, targetColumnId: string) => void;
  renderCard: (item: T) => React.ReactNode;
}

export function KanbanBoard<T extends { id: string }>({
  items,
  columns,
  getColumnId,
  onCardDrop,
  renderCard,
}: KanbanBoardProps<T>) {
  // Prevent hydration mismatch by rendering only after mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
        {columns.map((col) => (
          <div key={col.id} className="bg-card/40 border border-border/50 rounded-xl p-4 min-h-[300px]" />
        ))}
      </div>
    );
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const itemId = result.draggableId;
    const targetColumnId = result.destination.droppableId;
    
    // Only trigger action if column actually changed
    if (result.source.droppableId !== targetColumnId) {
      onCardDrop(itemId, targetColumnId);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {columns.map((column) => {
          const colItems = items.filter((item) => getColumnId(item) === column.id);

          return (
            <div
              key={column.id}
              className="flex flex-col flex-1 min-w-[280px] max-w-[350px] bg-muted/20 border border-border/40 rounded-xl p-3 h-[calc(100vh-280px)] min-h-[450px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-foreground">{column.title}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {colItems.length}
                  </span>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 flex flex-col gap-3 overflow-y-auto pr-1 pb-10 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent rounded-lg transition-colors duration-200 ${
                      snapshot.isDraggingOver ? "bg-muted/40" : ""
                    }`}
                  >
                    {colItems.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                            className={`transform transition-all duration-200 ${
                              snapshot.isDragging ? "ring-2 ring-primary/50 shadow-lg scale-[1.02]" : "hover:scale-[1.01]"
                            }`}
                          >
                            {renderCard(item)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
