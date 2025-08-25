import OpenAI from 'openai';
import { TriageResult } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeSymptomsWithLLM(
  symptoms: string,
  medicalHistory?: string
): Promise<TriageResult> {
  const prompt = `As a medical AI assistant, analyze the following patient symptoms and medical history to determine:
1. Priority level (critical, high, medium, or low)
2. Medical specialty needed
3. Brief reasoning for the assessment

Patient Symptoms: ${symptoms}
Medical History: ${medicalHistory || 'None provided'}

Respond in JSON format like:
{
  "priority": "critical|high|medium|low",
  "specialty": "specialty name",
  "reasoning": "brief explanation",
  "confidence": 0.0-1.0
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",  // Using GPT-4 for better medical reasoning
      messages: [
        {
          role: "system",
          content: "You are a medical triage AI assistant with expertise in emergency medicine and patient assessment."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,  // Lower temperature for more consistent medical assessments
      max_tokens: 300
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      priority: result.priority || 'medium',
      specialty: result.specialty || 'general',
      confidence: result.confidence || 0.7,
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error('LLM Analysis failed:', error);
    // Fallback to rule-based system if LLM fails
    return fallbackAnalysis(symptoms, medicalHistory);
  }
}

// Fallback to our rule-based system if LLM is unavailable
function fallbackAnalysis(symptoms: string, medicalHistory?: string): TriageResult {
  // Our existing rule-based logic here
  const combinedText = `${symptoms} ${medicalHistory || ''}`.toLowerCase();
  
  if (CRITICAL_SYMPTOMS.some(s => combinedText.includes(s))) {
    return {
      priority: 'critical',
      specialty: 'emergency',
      confidence: 0.8,
      reasoning: 'Critical symptoms detected requiring immediate attention'
    };
  }

  // ... rest of the fallback logic
  return {
    priority: 'medium',
    specialty: 'general',
    confidence: 0.6,
    reasoning: 'Default triage assessment based on basic symptom analysis'
  };
}

// Vector embedding using OpenAI
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    // Fallback to random embedding if OpenAI is unavailable
    return Array(1536).fill(0).map(() => Math.random() - 0.5);
  }
}

// Enhanced similarity search using embeddings
export async function findSimilarCases(
  symptoms: string,
  previousCases: any[],  // Replace with proper type
  limit: number = 5
): Promise<any[]> {  // Replace with proper type
  try {
    const queryEmbedding = await generateEmbedding(symptoms);
    
    // Calculate cosine similarity with previous cases
    const casesWithSimilarity = previousCases.map(case_ => ({
      ...case_,
      similarity: cosineSimilarity(queryEmbedding, case_.embedding)
    }));

    // Sort by similarity and return top matches
    return casesWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error('Similar case search failed:', error);
    return [];
  }
}

// Utility function for cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
