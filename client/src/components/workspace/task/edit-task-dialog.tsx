import { Dialog, DialogContent } from "@/components/ui/dialog";
import EditTaskForm from "./edit-task-form";
import { TaskType } from "@/types/api.type";
import TaskChecklist from "./task-checklist";

const EditTaskDialog = ({ task, isOpen, onClose }: { task: TaskType; isOpen: boolean; onClose: () => void }) => {
  return (
    <Dialog modal={true} open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-auto my-5 border-0">
        <div className="grid gap-6 md:grid-cols-2">
          <EditTaskForm task={task} onClose={onClose} />
          <div>
            <h3 className="text-lg font-semibold mb-2">Checklist</h3>
            <TaskChecklist task={task} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
