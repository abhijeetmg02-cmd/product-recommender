import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `You are a product-recommendation engine for an electronics catalog.
You will be given a shopper's request and a JSON catalog of available products.
Pick the products that best match the request (consider price limits, category, and stated needs).
Respond with ONLY raw JSON (no markdown, no commentary, no code fences) in this exact shape:
{"recommendations": [{"id": "p1", "reason": "short reason under 12 words"}]}
If nothing matches, return {"recommendations": []}.`;

app.post("/api/recommend", async (req, res) => {
  const { query, catalog } = req.body;

  if (!query || !Array.isArray(catalog)) {
    return res.status(400).json({ error: "Missing 'query' or 'catalog' in request body." });
  }

  const promptText = `${SYSTEM_PROMPT}\n\nCatalog:\n${JSON.stringify(catalog)}\n\nShopper request: "${query}"`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(500).json({ error: "AI provider returned an error." });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: "No text content in AI response." });
    }

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return res.json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));