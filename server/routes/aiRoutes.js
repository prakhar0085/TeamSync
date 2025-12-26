import express from "express";
import { generateProjectTasks } from "../services/aiService.js";

const router = express.Router();

router.post("/generate-tasks", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const tasks = await generateProjectTasks(prompt);
        res.json({ tasks });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
