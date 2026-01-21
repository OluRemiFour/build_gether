const { GoogleGenAI } = require("@google/genai");
const { trackGemini } = require("opik-gemini");
const dotenv = require("dotenv");

dotenv.config();

const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

// Wrap with Opik for LLM observability
const trackedAi = trackGemini(ai, { 
    generationName: "build_gather_ai_assistant",
    traceMetadata: {
        feature: "ai_assistant"
    }
});

const AIChat = require("../models/AIChat");

const SYSTEM_PROMPT = `
You are the AI Assistant for "Build Gather" (also known as BuildGether or BuildMate).
Your goal is to help users find projects, understand the platform, and debug issues.

### CRITICAL GUARDRAILS:
1. **Confidentiality**: Do NOT reveal any technical "secrets", internal architecture details, API keys, or database schemas. Stick to platform features and user-facing benefits.
2. **Context**: Only answer questions related to Build Gather, project management, developer collaboration, and tech stacks used in projects.
3. **Out of Scope**: If a user asks something completely unrelated to the platform or professional collaboration, politely state that you can't help with that and redirect them: "For further inquiries or specialized support, please send an email to innovativedesign67@gmail.com".

### Core Knowledge:
1. **What is Build Gather?**: A premium platform for developers, designers, and product managers to find teammates for hackathons, side projects, or startups.
2. **Key Features**: Signups (Owner/Collaborator), Dashboard (Matches/Apps), Roles (Frontend, Backend, etc.), Match Scores.
3. **Functionalities**: Tech Stack Constellation, Real-time messaging, Project Analytics.
4. **FAQ**: Free for individuals, profile completeness matters, roles can be updated in Settings.

Keep answers concise, professional, and helpful.
`;

const chat = async (req, res) => {
  try {
    const { message, previousMessages } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
    }

    await AIChat.create({
        userId,
        role: "user",
        text: message
    });
    

    const contents = [];
    if (previousMessages && Array.isArray(previousMessages)) {
        previousMessages.forEach(msg => {
            contents.push({
                role: msg.sender === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            });
        });
    }

    const result = await trackedAi.models.generateContent({
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM_PROMPT,
        contents: [
            ...contents,
            { role: "user", parts: [{ text: message }] }
        ],
        config: {
            maxOutputTokens: 1000,
            temperature: 0.7
        }
    });

    const text = result.text;

    if (!text) {
        throw new Error("Empty response from AI");
    }

    await AIChat.create({
        userId,
        role: "ai",
        text: text
    });

    res.status(200).json({ 
        success: true, 
        reply: text 
    });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ 
        message: "Failed to generate response", 
        error: error.message 
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await AIChat.find({ userId }).sort({ createdAt: 1 }).limit(50);
    

    const formattedHistory = history.map(msg => ({
      id: msg._id,
      text: msg.text,
      sender: msg.role === 'user' ? 'user' : 'ai',
      timestamp: msg.createdAt
    }));

    res.status(200).json(formattedHistory);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history", error: error.message });
  }
};

module.exports = { chat, getHistory };
