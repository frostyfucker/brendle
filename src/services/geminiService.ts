
import { GoogleGenAI, Type } from "@google/genai";
import { WorkOrder, OperationalAlert, RenovationAdvice, Expense, FeedbackAnalysisResult, LocalGuideResult, Task, OrderItem, SessionSummaryResult } from '../types';

// Initialize the Google AI client. It is assumed the API key is set in the environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert a File object to a GoogleGenAI.Part object
const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const generateDashboardSummary = async (): Promise<string> => {
  try {
    const prompt = `You are an AI assistant for a hotel manager named Dane. The hotel is undergoing a major renovation. This daily briefing is from his trusted partner, Roy, and you, Gemini. Start the message with "Good morning Dane! This is your Daily briefing brought to you by Roy & Gemini." Then, provide a brief, encouraging, and insightful summary of the hotel's current operational status.
    Current Metrics:
    - Occupancy Rate: 45%
    - Rooms Available: 58
    - Guest Satisfaction (for occupied rooms): 4.6/5

    Highlight one positive metric and suggest one area of focus related to managing the renovation alongside operations. Keep the main message concise (2-3 sentences).`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.6,
          maxOutputTokens: 200,
        }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating dashboard summary:", error);
    return "Welcome, Dane. Let's make progress on the renovation today.";
  }
};

export const analyzeTasksWithDirective = async (directive: string, tasks: Task[]): Promise<Task[]> => {
    try {
        const prompt = `As an AI hotel operations manager, analyze the following task list based on the manager's directive for the day. For each task, add a concise "note" explaining how it aligns with or conflicts with the directive, and set an "aiStatus" of either "Approved" or "On Hold". Do not change the original task text.

        Manager's Directive: "${directive}"

        Task List:
        ${tasks.map(t => `- ${t.text}`).join('\n')}

        Return a JSON array of objects, where each object has "text", "aiStatus", and "note".
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        analyzedTasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: {type: Type.STRING},
                                    aiStatus: {type: Type.STRING, enum: ['Approved', 'On Hold']},
                                    note: {type: Type.STRING}
                                }
                            }
                        }
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        // Match results back to original tasks
        return tasks.map(originalTask => {
            const analysis = result.analyzedTasks.find((t: any) => t.text === originalTask.text);
            return analysis ? { ...originalTask, ...analysis } : originalTask;
        });

    } catch (error) {
        console.error("Error analyzing tasks with directive:", error);
        return tasks.map(t => ({...t, note: "AI analysis failed."}));
    }
}

export const breakdownAndAssignTask = async (taskText: string): Promise<Omit<Task, 'id' | 'completed'>> => {
    try {
        const prompt = `You are an AI project manager for a hotel renovation. A high-level task has been created. Your job is to break it down into actionable steps, list required materials and tools, and assign the sub-tasks to the most relevant person. The only people available are "Dane" (Manager) and "Roy" (Lead Technician).

        High-Level Task: "${taskText}"

        Break this down into:
        1.  \`subTasks\`: An array of objects, each with 'text' and 'assignee' ('Dane' or 'Roy').
        2.  \`materials\`: An array of strings for necessary materials.
        3.  \`tools\`: An array of strings for necessary tools.
        
        Return the result in the specified JSON format. Be specific and practical.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subTasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING },
                                    assignee: { type: Type.STRING, enum: ["Dane", "Roy"] }
                                },
                                required: ["text", "assignee"]
                            }
                        },
                        materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                        tools: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["subTasks", "materials", "tools"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        const breakdown = JSON.parse(jsonText);
        
        return {
            text: taskText,
            isNew: true,
            subTasks: breakdown.subTasks.map((st: any) => ({...st, completed: false})),
            materials: breakdown.materials,
            tools: breakdown.tools,
        };

    } catch (error) {
        console.error("Error breaking down task:", error);
        // Provide a fallback response
        return {
            text: taskText,
            isNew: true,
            note: "AI task breakdown failed. Please assign manually.",
            subTasks: [],
            materials: [],
            tools: []
        };
    }
};


export const analyzeMaintenanceVideo = async (videoFile: File): Promise<Omit<WorkOrder, 'location'>> => {
    try {
        const videoPart = await fileToGenerativePart(videoFile);
        const textPart = {
            text: `Analyze this short video of a hotel maintenance issue during a renovation. The staff member may describe the problem verbally.
            Your task is to:
            1. Transcribe speech and identify the primary issue shown in the video.
            2. Create a concise title for a work order.
            3. Assign a priority level: 'Low', 'Medium', or 'High'.
            4. List specific tools that might be required.
            5. List specific materials that might be required.
            6. Provide a rough cost estimate for the repair, breaking it down into materials and labor costs (in USD).
            
            Return the analysis in the specified JSON format.`
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, videoPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A concise title for the work order." },
                        priority: {
                            type: Type.STRING,
                            enum: ["Low", "Medium", "High"],
                            description: "The priority level of the task."
                        },
                        description: {
                            type: Type.STRING,
                            description: "A detailed description of the issue, based on video and audio."
                        },
                        tools: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of tools likely needed for the repair."
                        },
                        materials: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of materials likely needed for the repair."
                        },
                        estimatedCost: {
                            type: Type.OBJECT,
                            description: "An estimated cost breakdown for the repair.",
                            properties: {
                                materials: { type: Type.NUMBER, description: "Estimated cost of materials in USD." },
                                labor: { type: Type.NUMBER, description: "Estimated cost of labor in USD." }
                            },
                            required: ["materials", "labor"]
                        }
                    },
                    required: ["title", "priority", "description", "tools", "materials", "estimatedCost"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error analyzing maintenance video:", error);
        throw new Error("Failed to analyze video. The AI service may be unavailable or the video format is not supported.");
    }
};

export const getOperationalInsights = async (): Promise<OperationalAlert[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the AI operations brain for a hotel undergoing a major renovation. Current situation: Occupancy is low at 45% due to renovations. A construction delivery is expected today. Generate exactly 3 diverse, actionable, and predictive operational alerts. One alert should be about contractor coordination, one about potential guest disruption, and one about safety or logistics. The alerts should be concise and professional.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            alerts: {
              type: Type.ARRAY,
              description: 'List of predictive operational alerts for renovation.',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "A unique ID for the alert, e.g., 'alert-1'" },
                  title: { type: Type.STRING, description: "A short, catchy title for the alert." },
                  description: { type: Type.STRING, description: "A one-sentence description of the alert and suggested action." },
                  priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'], description: "Priority of the alert." },
                },
                required: ['id', 'title', 'description', 'priority'],
              },
            },
          },
          required: ['alerts'],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.alerts || [];
  } catch (error) {
    console.error('Error fetching operational insights:', error);
    return [
      {
        id: 'err-1',
        title: 'AI Service Offline',
        description: 'Could not fetch live predictive alerts. Displaying cached information.',
        priority: 'Medium',
      },
    ];
  }
};

export const getRenovationAdvice = async (prompt: string): Promise<RenovationAdvice> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `As an AI expert in interior design and hotel renovation, provide advice for the following project goal. Return the advice in the specified JSON format. Goal: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        conceptSummary: { type: Type.STRING, description: "A brief summary of a design concept for the renovation goal." },
                        designElements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of key design elements to achieve the look." },
                        materialSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of suggested materials." },
                        potentialChallenges: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of potential challenges or pitfalls to consider." }
                    },
                    required: ["conceptSummary", "designElements", "materialSuggestions", "potentialChallenges"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error getting renovation advice:", error);
        throw new Error("Failed to get renovation advice. The AI service may be unavailable.");
    }
};

export const getBudgetInsight = async (totalBudget: number, expenses: Expense[]): Promise<string> => {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remainingBudget = totalBudget - totalSpent;

    try {
        const prompt = `You are a financial advisor AI for a hotel renovation project.
        - Total Budget: $${totalBudget.toLocaleString()}
        - Total Spent: $${totalSpent.toLocaleString()}
        - Remaining Budget: $${remainingBudget.toLocaleString()}
        - Recent Expenses: ${expenses.slice(-5).map(e => `${e.title}: $${e.amount}`).join(', ')}

        Provide a single, concise sentence of analysis and advice. For example, mention if spending is on track, accelerating, or if a specific category is becoming costly.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5,
                maxOutputTokens: 100,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error generating budget insight:", error);
        return "Could not fetch AI insight. Please check your spending against your budget manually.";
    }
};

export const generateWelcomeMessage = async (guestName: string, interests: string): Promise<string> => {
    try {
        const prompt = `You are a friendly and professional hotel concierge. Create a personalized welcome message for a guest.
        Guest Name: ${guestName}
        Guest Interests: ${interests}
        Keep the message warm, concise (about 3-4 sentences), and mention one or two local things related to their interests without being too specific about business names. End with a warm welcome to Hotel Brendle.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                maxOutputTokens: 250,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error generating welcome message:", error);
        throw new Error("Failed to generate a welcome message. The AI service may be unavailable.");
    }
};

export const analyzeGuestFeedback = async (feedbackText: string): Promise<FeedbackAnalysisResult> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following guest feedback. Summarize the overall sentiment in one sentence. Extract key positive points and key negative points.
            Feedback: "${feedbackText}"
            
            Return the analysis in the specified JSON format.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A one-sentence summary of the guest's feedback." },
                        positives: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of specific positive points mentioned by the guest."
                        },
                        negatives: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of specific negative points or areas for improvement mentioned by the guest."
                        }
                    },
                    required: ["summary", "positives", "negatives"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error analyzing guest feedback:", error);
        throw new Error("Failed to analyze feedback. The AI service may be unavailable.");
    }
};

export const recommendLocalAttractions = async (interests: string): Promise<LocalGuideResult> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an expert local guide for an upscale hotel. A guest has the following interests: "${interests}".
            Recommend exactly 3 local attractions, which could be restaurants, museums, parks, or other points of interest. For each attraction, provide its name, a type (e.g., 'Restaurant', 'Museum', 'Park'), and a brief, enticing one-sentence description.
            
            Return the recommendations in the specified JSON format.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        attractions: {
                            type: Type.ARRAY,
                            description: "A list of recommended local attractions.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "The name of the attraction." },
                                    type: { type: Type.STRING, description: "The category of the attraction (e.g., 'Restaurant', 'Museum')." },
                                    description: { type: Type.STRING, description: "A brief, one-sentence description of the attraction." }
                                },
                                required: ["name", "type", "description"]
                            }
                        }
                    },
                    required: ["attractions"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error recommending local attractions:", error);
        throw new Error("Failed to get recommendations. The AI service may be unavailable.");
    }
};

export const analyzeInventoryOrderVideo = async (videoFile: File): Promise<OrderItem[]> => {
    try {
        const videoPart = await fileToGenerativePart(videoFile);
        const textPart = {
            text: `Analyze this video. The user is verbally stating a list of inventory items and quantities they need to order. Transcribe their speech precisely and extract only the items and quantities. If they say "a dozen", use 12. If they say "a case", try to infer a standard quantity like 24 if not specified otherwise.
            
            Return a JSON object with a single key "orderItems" which is an array of objects. Each object must have 'name' (string) and 'quantity' (number). If no items are clearly mentioned, return an empty array.`
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart, videoPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        orderItems: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "The name of the inventory item to order." },
                                    quantity: { type: Type.INTEGER, description: "The quantity to order." },
                                },
                                required: ['name', 'quantity']
                            }
                        }
                    },
                    required: ["orderItems"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.orderItems || [];

    } catch (error) {
        console.error("Error analyzing inventory video:", error);
        throw new Error("Failed to analyze video. The AI service may be unavailable or the format is not supported.");
    }
};

export const summarizeContent = async (content: string | File): Promise<SessionSummaryResult> => {
    try {
        const prompt = `You are an expert meeting assistant. Analyze the following content from a work session and provide a structured summary. The content could be a text transcript, or an audio/video recording. Extract the key discussion points and any actionable items mentioned. If there is speech in audio/video, transcribe it as part of your analysis.
        Please summarize this work session.
        Return the result in the specified JSON format.`;

        let requestContents: any;
        
        if (typeof content === 'string') {
             requestContents = { parts: [{ text: prompt + '\n\n--- CONTENT ---\n' + content }] };
        } else {
            const filePart = await fileToGenerativePart(content);
            const textPart = { text: prompt };
            requestContents = { parts: [textPart, filePart] };
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: requestContents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: 'A concise summary of the entire session.' },
                        keyPoints: {
                            type: Type.ARRAY,
                            description: 'A list of the most important topics or decisions.',
                            items: { type: Type.STRING }
                        },
                        actionItems: {
                            type: Type.ARRAY,
                            description: 'A list of tasks or actions that were agreed upon.',
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["summary", "keyPoints", "actionItems"]
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error summarizing content:", error);
        throw new Error("Failed to summarize content. The AI service may be unavailable or the file format is not supported.");
    }
};
