import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ISSUES, GET_USERS } from '../graphql/queries';
import { UPDATE_ISSUE } from '../graphql/mutations';
import IssueDetailModal from './IssueDetailModal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

interface Issue {
    id: string;
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    assigneeId?: number;
    reporterId: number;
    createdAt: string;
    updatedAt: string;
    enhancedDescription?: string;
    tags?: { id: string; name: string; color?: string }[];
}

interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    createdAt: string;
}

interface Column {
    id: string;
    title: string;
    items: Issue[];
}

interface KanbanBoardProps {
    filteredIssues?: Issue[];
    onRefetch?: () => void;
}

const DroppableColumn: React.FC<{
    id: string;
    children: React.ReactNode;
    className?: string;
}> = ({ id, children, className }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${isOver ? 'bg-blue-50 border-2 border-blue-300' : ''}`}
        >
            {children}
        </div>
    );
};

const SortableIssue: React.FC<{ issue: Issue; onIssueClick: (issue: Issue) => void; users: User[] }> = ({ issue, onIssueClick, users }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: issue.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'bg-red-100 text-red-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            case 'LOW': return 'bg-green-100 text-green-800';
            case 'URGENT': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getUserName = (userId: number) => {
        const user = users.find((u: User) => parseInt(u.id) === userId);
        if (!user) return 'Unknown User';
        return user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username || user.email;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-white rounded-xl p-5 mb-4 shadow-sm cursor-grab active:cursor-grabbing border-l-4 border-indigo-500 transition-all duration-200 ${isDragging
                ? 'ring-2 ring-indigo-400 shadow-xl rotate-2 scale-105'
                : 'hover:shadow-lg hover:-translate-y-1'
                }`}
        >
            <div className="font-bold text-gray-900 mb-3 text-base">
                {issue.title}
            </div>
            <div className="text-gray-600 text-sm mb-4 leading-relaxed">
                {issue.enhancedDescription || issue.description}
            </div>
            {/* Tags */}
            {issue.tags && issue.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {issue.tags.map(tag => (
                        <span key={tag.id} className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 text-xs font-medium" style={tag.color ? { backgroundColor: tag.color, color: '#fff' } : {}}>
                            {tag.name}
                        </span>
                    ))}
                </div>
            )}
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-xs">#{issue.id}</span>
                <span className={`px-3 py-1 text-xs rounded-full font-semibold ${getPriorityColor(issue.priority)}`}>
                    {issue.priority.charAt(0) + issue.priority.slice(1).toLowerCase()}
                </span>
            </div>
            {issue.assigneeId && (
                <div className="text-xs text-gray-600">
                    👤 {getUserName(issue.assigneeId)}
                </div>
            )}
            <div className="flex justify-end mt-3">
                <button
                    className="px-3 py-1 text-xs font-medium rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => {
                        e.stopPropagation();
                        onIssueClick(issue);
                    }}
                >
                    View
                </button>
            </div>
        </div>
    );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ filteredIssues, onRefetch }) => {
    const { data: usersData, loading: usersLoading, error: usersError } = useQuery(GET_USERS);
    const [updateIssue] = useMutation(UPDATE_ISSUE);
    const [columns, setColumns] = useState<Column[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const users = usersData?.users || [];

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Organize issues into columns based on status
    useEffect(() => {
        if (filteredIssues && filteredIssues.length > 0) {
            const newColumns: Column[] = [
                {
                    id: 'OPEN',
                    title: '📋 Open',
                    items: filteredIssues.filter((issue: Issue) => issue.status === 'OPEN')
                },
                {
                    id: 'IN_PROGRESS',
                    title: '🔄 In Progress',
                    items: filteredIssues.filter((issue: Issue) => issue.status === 'IN_PROGRESS')
                },
                {
                    id: 'CLOSED',
                    title: '✅ Closed',
                    items: filteredIssues.filter((issue: Issue) => issue.status === 'CLOSED')
                }
            ];
            setColumns(newColumns);
        } else {
            // Show empty columns if no filtered issues
            setColumns([
                { id: 'OPEN', title: '📋 Open', items: [] },
                { id: 'IN_PROGRESS', title: '🔄 In Progress', items: [] },
                { id: 'CLOSED', title: '✅ Closed', items: [] }
            ]);
        }
    }, [filteredIssues]);

    const handleIssueClick = (issue: Issue) => {
        setSelectedIssue(issue);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedIssue(null);
    };

    const handleDragStart = (event: DragStartEvent) => {
        console.log('=== DRAG START ===');
        console.log('Dragging item:', event.active.id);
        setActiveId(event.active.id.toString());
    };

    const handleDragOver = (event: DragOverEvent) => {
        console.log('=== DRAG OVER ===');
        console.log('Over:', event.over?.id);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        console.log('=== DRAG END DEBUG ===');
        console.log('Full event:', event);
        console.log('Active:', event.active);
        console.log('Over:', event.over);
        console.log('Current columns:', columns);

        const { active, over } = event;

        // Reset active ID
        setActiveId(null);

        if (!over) {
            console.log('❌ Dropped outside valid area');
            return;
        }

        // Check if dropped on the same item
        if (active.id === over.id) {
            console.log('❌ Dropped in same position');
            return;
        }

        // Find the source and destination columns
        let sourceColumn: Column | undefined;
        let destColumn: Column | undefined;
        let sourceColIndex = -1;
        let destColIndex = -1;

        for (let i = 0; i < columns.length; i++) {
            const col = columns[i];
            if (col.items.find(item => item.id === active.id)) {
                sourceColumn = col;
                sourceColIndex = i;
                console.log(`✅ Found source column: ${col.id} at index ${i}`);
            }
            // Check if dropped on a column container (column.id === over.id)
            if (col.id === over.id) {
                destColumn = col;
                destColIndex = i;
                console.log(`✅ Found dest column: ${col.id} at index ${i}`);
            }
        }

        if (!sourceColumn || !destColumn) {
            console.log('❌ Column not found. Source:', sourceColumn?.id, 'Dest:', destColumn?.id);
            return;
        }

        // Don't allow dropping in the same column
        if (sourceColumn.id === destColumn.id) {
            console.log('❌ Cannot drop in same column');
            return;
        }

        const sourceItem = sourceColumn.items.find(item => item.id === active.id);
        if (!sourceItem) {
            console.log('❌ Item not found');
            return;
        }

        console.log(`🚀 Moving item ${sourceItem.id} from ${sourceColumn.id} to ${destColumn.id}`);

        // Optimistically update the local state
        const updatedColumns = [...columns];
        const sourceCol = updatedColumns[sourceColIndex];
        const destCol = updatedColumns[destColIndex];

        // Remove from source column
        sourceCol.items = sourceCol.items.filter(item => item.id !== active.id);

        // Add to destination column with updated status
        const updatedItem = { ...sourceItem, status: destColumn.id as 'OPEN' | 'IN_PROGRESS' | 'CLOSED' };
        destCol.items = [...destCol.items, updatedItem];

        console.log('📝 Updating local state...');
        setColumns(updatedColumns);

        // Update the issue status in the backend
        try {
            console.log('🔄 Calling updateIssue mutation...');
            const result = await updateIssue({
                variables: {
                    input: {
                        id: parseInt(sourceItem.id),
                        status: destColumn.id as 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
                    }
                }
            });

            console.log('✅ Issue status updated successfully:', result);

            // If the mutation failed, revert the optimistic update
            if (!result.data?.updateIssue?.success) {
                console.error('❌ Failed to update issue status:', result.data?.updateIssue?.message);
                // Revert the optimistic update by refetching
                onRefetch?.();
            }
        } catch (error) {
            console.error('❌ Failed to update issue status:', error);
            // Revert the optimistic update by refetching
            onRefetch?.();
        }
    };

    if (usersLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading users...</div>
            </div>
        );
    }

    if (usersError) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">Error loading users: {usersError.message}</div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Workflow Header */}
            {/* <div className="mb-6 text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Workflow: Open → In Progress → Closed</h3>
                <p className="text-sm text-gray-500">Drag issues between columns to update their status</p>
            </div> */}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {columns.map((column, index) => (
                        <div key={column.id} className="relative">
                            {/* Workflow Arrow */}
                            {index < columns.length - 1 && (
                                <div className="hidden md:flex absolute -right-3 top-1/2 transform -translate-y-1/2 z-10">
                                    <div className="bg-white rounded-full p-2 shadow-lg border-2 border-gray-200">
                                        <span className="text-2xl text-gray-400">→</span>
                                    </div>
                                </div>
                            )}

                            <DroppableColumn
                                id={column.id}
                                className="bg-gray-50 rounded-2xl p-5 min-h-[500px] transition-all duration-200 hover:bg-gray-100"
                            >
                                <div className="p-4 bg-white rounded-xl mb-5 font-bold text-center shadow-sm relative border-l-4 border-green-500">
                                    {column.title} ({column.items.length})
                                </div>

                                <SortableContext items={column.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                                    {column.items.map((item) => (
                                        <SortableIssue
                                            key={item.id}
                                            issue={item}
                                            onIssueClick={handleIssueClick}
                                            users={users}
                                        />
                                    ))}
                                    {column.items.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg m-2">
                                            <p className="font-medium">Drop issues here</p>
                                            <p className="text-sm">Drag issues from other columns</p>
                                        </div>
                                    )}
                                </SortableContext>
                            </DroppableColumn>
                        </div>
                    ))}
                </div>

                <DragOverlay>
                    {activeId ? (
                        (() => {
                            // Find the active item across all columns
                            let activeItem: Issue | undefined;
                            for (const column of columns) {
                                activeItem = column.items.find(item => item.id === activeId);
                                if (activeItem) break;
                            }

                            if (activeItem) {
                                return (
                                    <div className="bg-white rounded-xl p-5 shadow-xl border-2 border-indigo-400 transform rotate-2 scale-105">
                                        <div className="font-bold text-gray-900 mb-3 text-base">
                                            {activeItem.title}
                                        </div>
                                        <div className="text-gray-600 text-sm mb-4 leading-relaxed">
                                            {activeItem.enhancedDescription || activeItem.description}
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-500 text-xs">#{activeItem.id}</span>
                                            <span className="px-3 py-1 text-xs rounded-full font-semibold bg-yellow-100 text-yellow-800">
                                                {activeItem.priority.charAt(0) + activeItem.priority.slice(1).toLowerCase()}
                                            </span>
                                        </div>
                                        {activeItem.assigneeId && (
                                            <div className="text-xs text-gray-600">
                                                👤 {users.find((u: User) => parseInt(u.id) === activeItem.assigneeId)?.firstName || 'Unknown User'}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return null;
                        })()
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Issue Detail Modal */}
            <IssueDetailModal
                issue={selectedIssue}
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                onSuccess={() => {
                    // The parent component will handle refetching
                }}
                users={users}
            />
        </div>
    );
};

export default KanbanBoard; 