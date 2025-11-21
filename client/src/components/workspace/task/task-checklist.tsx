import { useMutation, useQueryClient } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { addChecklistItemMutationFn, deleteChecklistItemMutationFn, updateChecklistItemMutationFn } from "@/lib/api";
import { TaskType, ChecklistItemType } from "@/types/api.type";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TaskChecklist({ task }: { task: TaskType }) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
  };

  const addMutation = useMutation({ mutationFn: addChecklistItemMutationFn, onSuccess: invalidate });
  const updateMutation = useMutation({ mutationFn: updateChecklistItemMutationFn, onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: deleteChecklistItemMutationFn, onSuccess: invalidate });

  const items = task.checklist || [];

  const addItem = () => {
    if (!title.trim()) return;
    addMutation.mutate({ workspaceId, taskId: task._id, title });
    setTitle("");
  };

  const toggleItem = (item: ChecklistItemType) => {
    updateMutation.mutate({ workspaceId, taskId: task._id, itemId: item._id, patch: { done: !item.done } });
  };

  const renameItem = (item: ChecklistItemType, newTitle: string) => {
    updateMutation.mutate({ workspaceId, taskId: task._id, itemId: item._id, patch: { title: newTitle } });
  };

  const removeItem = (item: ChecklistItemType) => {
    deleteMutation.mutate({ workspaceId, taskId: task._id, itemId: item._id });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input placeholder="Add checklist item" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} />
        <Button onClick={addItem} disabled={addMutation.isPending}>Add</Button>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item._id} className="flex items-center gap-2">
            <input type="checkbox" checked={item.done} onChange={() => toggleItem(item)} />
            <input
              className="border rounded px-2 py-1 text-sm flex-1"
              value={item.title}
              onChange={(e) => renameItem(item, e.target.value)}
            />
            <Button variant="ghost" onClick={() => removeItem(item)}>Delete</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}