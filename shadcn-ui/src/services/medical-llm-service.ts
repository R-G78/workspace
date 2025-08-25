import { HfInference } from '@huggingface/inference';
import { TriageResult } from './types';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const MODEL_ID = "medalpaca/medalpaca-13b";  // Medical domain specific model
const EMBEDDING_MODEL = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext";

export async function analyzeSymptomsWithMedicalLLM(
  symptoms: string,
  medicalHistory?: string
): Promise<TriageResult> {
  const prompt = `[INST] As a medical AI assistant trained on clinical data, analyze the following patient symptoms and medical history. Determine the priority level, required medical specialty, and provide clinical reasoning.

Patient Symptoms: ${symptoms}
Medical History: ${medicalHistory || 'None provided'}

Provide assessment in the following format:
Priority Level (critical/high/medium/low):
Required Specialty:
Clinical Reasoning:
Confidence Score (0.0-1.0):
[/INST]`;

  try {
    const response = await hf.textGeneration({
      model: MODEL_ID,
      inputs: prompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.3,  // Lower temperature for more consistent medical assessments
        top_p: 0.95,
        repetition_penalty: 1.15
      }
    });

    // Parse the response
    const output = response.generated_text;
    const priority = extractPriority(output);
    const specialty = extractSpecialty(output);
    const reasoning = extractReasoning(output);
    const confidence = extractConfidence(output);

    return {
      priority,
      specialty,
      reasoning,
      confidence
    };
  } catch (error) {
    console.error('Medical LLM Analysis failed:', error);
    // Fallback to rule-based system if LLM fails
    return fallbackAnalysis(symptoms, medicalHistory);
  }
}

// Use PubMedBERT for medical text embeddings
export async function generateMedicalEmbedding(text: string): Promise<number[]> {
  try {
    const response = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: text
    });

    return Array.isArray(response) ? response : [response];
  } catch (error) {
    console.error('Medical embedding generation failed:', error);
    // Fallback to random embedding if API is unavailable
    return Array(768).fill(0).map(() => Math.random() - 0.5);
  }
}

// Helper functions to parse LLM output
function extractPriority(output: string): 'critical' | 'high' | 'medium' | 'low' {
  const priorityMatch = output.match(/Priority Level.*?:\s*(critical|high|medium|low)/i);
  if (priorityMatch?.[1]) {
    return priorityMatch[1].toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
  }
  return 'medium'; // Default priority
}

function extractSpecialty(output: string): string {
  const specialtyMatch = output.match(/Required Specialty.*?:\s*([^\n]+)/i);
  return specialtyMatch?.[1]?.trim().toLowerCase() || 'general';
}

function extractReasoning(output: string): string {
  const reasoningMatch = output.match(/Clinical Reasoning.*?:\s*([^\n]+)/i);
  return reasoningMatch?.[1]?.trim() || 'No reasoning provided';
}

function extractConfidence(output: string): number {
  const confidenceMatch = output.match(/Confidence Score.*?:\s*(0\.\d+|1\.0)/i);
  return confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7;
}

// Enhanced medical similarity search
export async function findSimilarMedicalCases(
  symptoms: string,
  previousCases: any[],
  limit: number = 5
): Promise<any[]> {
  try {
    const queryEmbedding = await generateMedicalEmbedding(symptoms);
    
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

// Rule-based fallback system
function fallbackAnalysis(symptoms: string, medicalHistory?: string): TriageResult {
  const combinedText = `${symptoms} ${medicalHistory || ''}`.toLowerCase();
  
  // Critical symptoms that require immediate attention
  const criticalSymptoms = [
    'chest pain', 'difficulty breathing', 'shortness of breath', 'severe bleeding',
    'unconscious', 'stroke', 'heart attack', 'seizure', 'trauma', 'head injury'
  ];

  if (criticalSymptoms.some(s => combinedText.includes(s))) {
    return {
      priority: 'critical',
      specialty: 'emergency',
      confidence: 0.9,
      reasoning: 'Critical symptoms detected requiring immediate emergency care'
    };
  }

  // Default to medium priority if no patterns match
  return {
    priority: 'medium',
    specialty: 'general',
    confidence: 0.6,
    reasoning: 'Default triage assessment based on basic symptom analysis'
  };
}
