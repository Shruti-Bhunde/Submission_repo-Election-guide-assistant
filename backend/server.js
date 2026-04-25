// const express = require("express");
// const fetch = require("node-fetch");
// const cors = require("cors");
// const path = require("path");
// require("dotenv").config();

// const app = express();

// app.use(cors());
// app.use(express.json());

// /**
//  * 🔥 Safe Gemini call with continuation (production-safe)
//  */
// async function generateResponse(userMessage) {
//     let finalText = "";
//     let attempts = 0;
//     const maxAttempts = 3;

//     let prompt = `You are an election assistant.
// Give a COMPLETE, structured, and clear answer. Do not stop mid-sentence.

// User question: ${userMessage}

// Answer:`;

//     while (attempts < maxAttempts) {
//         const controller = new AbortController();
//         const timeout = setTimeout(() => controller.abort(), 20000);

//         const response = await fetch(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//             {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 signal: controller.signal,
//                 body: JSON.stringify({
//                     contents: [{ parts: [{ text: prompt }] }],
//                     generationConfig: {
//                         maxOutputTokens: 1024,
//                         temperature: 0.7,
//                         topP: 0.9,
//                         topK: 40
//                     }
//                 })
//             }
//         );

//         clearTimeout(timeout);

//         const data = await response.json();

//         if (!data?.candidates?.length) {
//             break;
//         }

//         const candidate = data.candidates[0];
//         const text = candidate?.content?.parts
//             ?.map(p => p.text || "")
//             .join("") || "";

//         const finishReason = candidate?.finishReason;

//         finalText += text;

//         // 🔥 safer continuation check
//         const looksIncomplete =
//             finishReason === "MAX_TOKENS" ||
//             (text.trim().length < 80 && !/[.!?]$/.test(text.trim()));

//         if (!looksIncomplete) {
//             break;
//         }

//         prompt = `Continue the answer naturally. Do NOT repeat:

// ${finalText}`;

//         attempts++;
//     }

//     return finalText || "No response from AI";
// }


// // ================= CHAT API =================
// app.post("/chat", async (req, res) => {
//     try {
//         const userMessage = req.body.message;

//         if (!userMessage) {
//             return res.status(400).json({ reply: "No message provided" });
//         }

//         const reply = await generateResponse(userMessage);

//         res.json({ reply });

//     } catch (err) {
//         console.error("SERVER ERROR:", err);
//         res.status(500).json({ reply: "Server error" });
//     }
// });


// // ================= FRONTEND =================
// app.use(express.static(path.join(__dirname, "../frontend")));

// app.get("/", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend/index.html"));
// });


// // ================= START =================
// const PORT = process.env.PORT || 8080;

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Allow only your frontend domain (update later)
app.use(cors({
    origin: "*", // change to your frontend URL after deploy
}));

app.use(express.json());

/**
 * 🔥 Gemini call with continuation (stable)
 */
async function generateResponse(userMessage) {
    let finalText = "";
    let attempts = 0;
    const maxAttempts = 3;

    let prompt = `You are an election assistant.
Give a COMPLETE, structured, and clear answer. Do not stop mid-sentence.

User question: ${userMessage}

Answer:`;

    while (attempts < maxAttempts) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            maxOutputTokens: 1024,
                            temperature: 0.7,
                            topP: 0.9,
                            topK: 40
                        }
                    })
                }
            );

            clearTimeout(timeout);

            if (!response.ok) {
                console.error("Gemini API error:", await response.text());
                break;
            }

            const data = await response.json();

            if (!data?.candidates?.length) break;

            const candidate = data.candidates[0];

            const text = candidate?.content?.parts
                ?.map(p => p.text || "")
                .join("") || "";

            const finishReason = candidate?.finishReason;

            finalText += text;

            const looksIncomplete =
                finishReason === "MAX_TOKENS" ||
                (text.trim().length < 80 && !/[.!?]$/.test(text.trim()));

            if (!looksIncomplete) break;

            prompt = `Continue the answer naturally. Do NOT repeat:

${finalText}`;

            attempts++;

        } catch (err) {
            console.error("Gemini fetch error:", err);
            break;
        }
    }

    return finalText || "No response from AI";
}


// ================= API =================
app.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ reply: "No message provided" });
        }

        const reply = await generateResponse(userMessage);

        res.json({ reply });

    } catch (err) {
        console.error("SERVER ERROR:", err);
        res.status(500).json({ reply: "Server error" });
    }
});


// ================= HEALTH CHECK (IMPORTANT) =================
const path = require("path");

app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});


// ================= START =================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});