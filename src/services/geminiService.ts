import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function handleGeminiError(error: any) {
  console.error("Gemini API Error:", error);
  if (error?.message?.includes("RESOURCE_EXHAUSTED") || error?.status === 429) {
    throw new Error("AI Quota Exceeded: The AI is currently busy or has reached its limit. Please wait a minute and try again.");
  }
  throw error;
}

export async function generateDesignIdeas(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a Senior Creative Director for a high-end streetwear and digital brand house. 
      Analyze current market micro-trends (e.g., 'Gorpcore', 'Solarpunk', 'Cyber-Y2K') and provide a 'Brand Strategy Package' for the following prompt.
      
      Prompt: ${prompt}
      
      Your response MUST be in the following structured format:
      
      ### 🎨 Brand Strategy Package
      
      #### 🧠 Color Psychology
      - [HEX Code]: [Reasoning why this fits the vibe]
      - [HEX Code]: [Reasoning why this fits the vibe]
      
      #### 🧵 Materiality
      - [Suggested Fabric 1]: [Why this fabric?]
      - [Suggested Fabric 2]: [Why this fabric?]
      
      #### 🎯 Market Positioning
      - **Target Audience**: [Description of the audience]
      - **Brand Voice**: [Tone of the brand]
      
      ### 📐 Design Directions
      
      **1. The Minimalist**
      [Description of a clean, understated version]
      
      **2. The Bold**
      [Description of a loud, statement-making version]
      
      **3. The Experimental**
      [Description of a boundary-pushing, avant-garde version]`,
    });
    return response.text;
  } catch (error) {
    return handleGeminiError(error);
  }
}

export async function auditDesign(imageUrl: string, prompt?: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageUrl.split(',')[1]
          }
        },
        {
          text: `As a Senior Creative Director, audit this design/logo. 
          ${prompt ? `Context: ${prompt}` : ''}
          
          Provide:
          1. **Trend Score**: (0-100) based on current 2026 aesthetics.
          2. **Analysis**: What works and what doesn't.
          3. **The 'Designated' Tweak**: One specific, high-impact modification to elevate the design.
          
          Format your response clearly with headers.`
        }
      ]
    });
    return response.text;
  } catch (error) {
    return handleGeminiError(error);
  }
}

export async function getTrendyVibes() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Analyze current global fashion trends for 2026. Provide a list of 5 trendy 'vibes' or themes for a new clothing brand, including color palettes and key silhouettes.",
    });
    return response.text;
  } catch (error) {
    return handleGeminiError(error);
  }
}

export async function getBrandGuide() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Provide a concise, step-by-step guide on how to start a successful clothing brand in 2026. Focus on brand identity, sourcing, and marketing.",
    });
    return response.text;
  } catch (error) {
    return handleGeminiError(error);
  }
}

export async function generateDesignImage(prompt: string) {
  try {
    // Using gemini-2.5-flash-image for image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A high-quality, professional fashion design illustration of: ${prompt}. Minimalist background, professional lighting.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    return handleGeminiError(error);
  }
}
