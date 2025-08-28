import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { BlobServiceClient } from '@azure/storage-blob';
import type { PatientRecord, VitalSigns } from '../types/medical';
import { CRITICAL_SYMPTOMS } from '../lib/constants';

export class MedicalAIService {
  private openai: OpenAI;
  private claude: Anthropic;
  private blobClient: BlobServiceClient;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.blobClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || '');
  }

  // Private helper methods
  private logDiscrepancy(description: string, data: any) {
    console.warn(`Medical AI Discrepancy: ${description}`, data);
  }

  private parseClaudeResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      return null;
    }
  }

  private buildVerificationPrompt(data: any): string {
    return `Please verify the following medical assessment:\n${JSON.stringify(data, null, 2)}\n\nProvide your assessment as JSON with fields: isValid (boolean), concerns (string[]), and suggestions (string[]).`;
  }

  private parseVerificationResponse(response: string): { isValid: boolean; concerns: string[]; suggestions: string[] } {
    try {
      const parsed = this.parseClaudeResponse(response);
      return {
        isValid: parsed.isValid ?? false,
        concerns: parsed.concerns ?? [],
        suggestions: parsed.suggestions ?? []
      };
    } catch (error) {
      console.error('Failed to parse verification response:', error);
      return {
        isValid: false,
        concerns: ['Failed to parse verification response'],
        suggestions: ['Please review manually']
      };
    }
  }

  // Rest of the class implementation...
}
