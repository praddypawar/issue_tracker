import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

const initialData = {
    columns: {
        open: {
            name: 'Open',
            items: [
                { id: '1', title: 'Fix login bug' },
                { id: '2', title: 'Add Kanban board' },
            ],
        },
        inProgress: {
            name: 'In Progress',
            items: [
                { id: '3', title: 'Update docs' },
            ],
        },
        closed: {
            name: 'Closed',
            items: [
                { id: '4', title: 'Refactor API' },
            ],
        },
    },
};

type Issue = { id: string; title: string };
type Column = { name: string; items: Issue[] };
type BoardData = { columns: { [key: string]: Column } };

const KanbanBoard: React.FC = () => {
    const [board, setBoard] = useState<BoardData>(initialData);

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }
        const sourceCol = board.columns[source.droppableId];
        const destCol = board.columns[destination.droppableId];
        const sourceItems = Array.from(sourceCol.items);
        const [removed] = sourceItems.splice(source.index, 1);
        if (source.droppableId === destination.droppableId) {
            sourceItems.splice(destination.index, 0, removed);
            setBoard({
                columns: {
                    ...board.columns,
                    [source.droppableId]: {
                        ...sourceCol,
                        items: sourceItems,
                    },
                },
            });
        } else {
            const destItems = Array.from(destCol.items);
            destItems.splice(destination.index, 0, removed);
            setBoard({
                columns: {
                    ...board.columns,
                    [source.droppableId]: {
                        ...sourceCol,
                        items: sourceItems,
                    },
                    [destination.droppableId]: {
                        ...destCol,
                        items: destItems,
                    },
                },
            });
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4">
                {Object.entries(board.columns).map(([colId, col]) => (
                    <Droppable droppableId={colId} key={colId}>
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex-1 bg-gray-50 rounded-lg p-4 min-h-[200px] shadow ${snapshot.isDraggingOver ? 'bg-indigo-50' : ''}`}
                            >
                                <h4 className="font-semibold mb-4 text-gray-700">{col.name}</h4>
                                {col.items.map((item, idx) => (
                                    <Draggable draggableId={item.id} index={idx} key={item.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`mb-3 p-3 bg-white rounded shadow cursor-pointer border border-gray-200 ${snapshot.isDragging ? 'ring-2 ring-indigo-400' : ''}`}
                                            >
                                                {item.title}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                ))}
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard; 