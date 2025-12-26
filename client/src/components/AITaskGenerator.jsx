import { useState } from "react";
import { SparklesIcon, XIcon, CheckIcon, Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../configs/api";
import { useDispatch, useSelector } from "react-redux";
import { addTask, fetchWorkspaces } from "../features/workspaceSlice";
import { useAuth, useUser } from "@clerk/clerk-react";

export default function AITaskGenerator({ showAIGenerator, setShowAIGenerator, projectId, members }) {
    const { getToken } = useAuth();
    const { user } = useUser();
    const dispatch = useDispatch();
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);

    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        try {
            const token = await getToken();
            const { data } = await api.post("/api/ai/generate-tasks", { prompt }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGeneratedTasks(data.tasks.map(t => ({
                ...t,
                assigneeId: user?.id || "",
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })));
        } catch (error) {
            toast.error("Failed to generate tasks. Please try again.");
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateAll = async () => {
        setIsCreating(true);
        const token = await getToken();
        let successCount = 0;
        let failCount = 0;

        if (!currentWorkspace) {
            toast.error("No active workspace found. Please refresh.");
            setIsCreating(false);
            return;
        }

        try {
            for (const task of generatedTasks) {
                try {
                    const taskData = {
                        ...task,
                        projectId,
                        workspaceId: currentWorkspace.id,
                        type: "TASK",
                        status: "TODO",
                        assigneeId: task.assigneeId,
                        priority: (task.priority || "MEDIUM").toUpperCase(),
                        due_date: task.due_date
                    };

                    const { data } = await api.post("/api/tasks", taskData, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    dispatch(addTask(data.task));
                    successCount++;
                } catch (err) {
                    console.error("Failed to create task:", task.title, err);
                    failCount++;
                    toast.error(`Failed to create "${task.title}": ${err.response?.data?.message || err.message}`);
                }
            }
            
            if (successCount > 0) {
                toast.success(`Successfully created ${successCount} tasks!`);
                await dispatch(fetchWorkspaces({ getToken }));
                setShowAIGenerator(false);
                setGeneratedTasks([]);
                setPrompt("");
            } else if (failCount > 0) {
                toast.error("Failed to create any tasks. Check console for details.");
            }
            
        } catch (error) {
            toast.error("System error creating tasks: " + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    if (!showAIGenerator) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-2xl p-6 text-zinc-900 dark:text-white max-h-[90vh] overflow-y-auto">
                
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="size-5 text-purple-500" />
                        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">AI Task Generator</h2>
                    </div>
                    <button onClick={() => setShowAIGenerator(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                        <XIcon className="size-5" />
                    </button>
                </div>

                {generatedTasks.length === 0 ? (
                    <div className="space-y-4">
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Describe your project goals or requirements, and AI will generate a structured task list for you.
                        </p>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Build a login system with email and password auth, including forgot password flow..."
                            className="w-full h-32 p-4 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt.trim()}
                                className="flex items-center gap-2 px-6 py-2.5 rounded bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
                            >
                                {isGenerating ? <Loader2Icon className="size-4 animate-spin" /> : <SparklesIcon className="size-4" />}
                                {isGenerating ? "Generating..." : "Generate Tasks"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            {generatedTasks.map((task, idx) => (
                                <div key={idx} className="p-4 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-purple-500/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold">{task.title}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            task.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>{task.priority}</span>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{task.description}</p>
                                    
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label className="text-xs text-zinc-500 font-medium ml-1">Assignee</label>
                                            <select 
                                                value={task.assigneeId} 
                                                onChange={(e) => {
                                                    const newTasks = [...generatedTasks];
                                                    newTasks[idx].assigneeId = e.target.value;
                                                    setGeneratedTasks(newTasks);
                                                }}
                                                className="w-full mt-1 px-2 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-1 focus:ring-purple-500 outline-none"
                                            >
                                                <option value="" disabled>Select Assignee</option>
                                                {members && members.map((member) => (
                                                    <option key={member.user.id} value={member.user.id}>
                                                        {member.user.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 font-medium ml-1">Due Date</label>
                                            <input 
                                                type="date" 
                                                value={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ""} 
                                                onChange={(e) => {
                                                    const newTasks = [...generatedTasks];
                                                    newTasks[idx].due_date = new Date(e.target.value).toISOString();
                                                    setGeneratedTasks(newTasks);
                                                }}
                                                className="w-full mt-1 px-2 py-1.5 text-sm rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-1 focus:ring-purple-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <button
                                onClick={() => setGeneratedTasks([])}
                                className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCreateAll}
                                disabled={isCreating}
                                className="flex items-center gap-2 px-6 py-2.5 rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium hover:opacity-90 disabled:opacity-50"
                            >
                                {isCreating ? <Loader2Icon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
                                {isCreating ? "Creating..." : "Confirm & Create All"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
