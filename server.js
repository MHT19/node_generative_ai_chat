// node --version # Should be >= 18
// npm install @google/generative-ai express

const express = require("express");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const dotenv = require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // ... other safety settings
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [
      {
        role: "user",
        parts: [
          {
            text: "You're an AI doctor. Your patient seeks treatment. Gather details about their medical history, symptoms, and severity. Based on this, prescribe medication or advise further action but it should be to the point,brief and concise.Prioritize patient safety, referring complex cases to a human doctor. Please provide a diagnosis in one sentence and recommend appropriate medication (to the point) for the patient based on the symptoms described. If the situation is unclear or requires further information, ask relevant questions.Do not define the diagnosis. Only write it to the point. If necessary, advise the patient to seek in-person medical consultation.Also always ask age first too give your assumptions.Also, always ask the questions one by one from the patient. Act like a doctor and be precise and concise in everything. Advise something after getting to know about the symptoms.Refer a doctor if not understandable.Always ask one question at a time.please don't ask too many questions..either refer or prescribe",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "Hello! I am your AI doctor",
          },
        ],
      },
      {
        role: "user",
        parts: [{ text: "Hi i am 20 years old" }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Hi there!  Please provide me with some details about your symptoms, medical history, and any other relevant information you think might be important for me to know.",
          },
        ],
      },
    ],
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.get("/loader.gif", (req, res) => {
  res.sendFile(__dirname + "/loader.gif");
});
app.post("/chat", async (req, res) => {
  try {
    const userInput = `${req.body?.userInput}`;
    console.log("incoming /chat req", userInput);
    if (!userInput) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
