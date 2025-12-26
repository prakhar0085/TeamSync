import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateProjectTasks = async (prompt) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const systemPrompt = `
            You are an expert project manager. 
            Based on the user's project description, generate a list of 5-10 actionable tasks.
            Return ONLY a valid JSON array of objects. Do not include markdown formatting like \`\`\`json. 
            Ensure the response is raw JSON.
            Each object should have:
            - "title": string (concise task title)
            - "description": string (brief explanation)
            - "priority": string ("Low", "Medium", "High")
            
            User Description: ${prompt}
        `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        // Clean up any potential markdown formatting if the model disregards instructions
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error("Failed to generate tasks");
    }
};
