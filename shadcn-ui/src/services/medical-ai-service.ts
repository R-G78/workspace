import { PatientRecord, TriageResult, VitalSigns } from '@/types';
import { Claude } from '@anthropic-ai/sdk';
import { BlobServiceClient } from '@azure/storage-blob';
import { Configuration, OpenAIApi } from 'openai';
import { HL7Message } from '@/utils/hl7';

// Initialize clients with proper error handling and retry logic
const claude = new Claude({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Add retry logic and timeout configurations
  maxRetries: 3,
  timeout: 30000,
});

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);

// Backup LLM for redundancy
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

interface MedicalAnalysisResult extends TriageResult {
  confidenceScore: number;
  reasoningChain: string[];
  recommendedTests?: string[];
  differentialDiagnosis?: string[];
  icdCodes?: string[];
  snomedCodes?: string[];
  auditLog: {
    timestamp: string;
    model: string;
    version: string;
    inputHash: string;
  };
}

export class MedicalAIService {
  private static instance: MedicalAIService;
  private auditContainer = blobServiceClient.getContainerClient('ai-audit-logs');

  private constructor() {
    this.initializeAuditLog();
  }

  public static getInstance(): MedicalAIService {
    if (!MedicalAIService.instance) {
      MedicalAIService.instance = new MedicalAIService();
    }
    return MedicalAIService.instance;
  }

  private async initializeAuditLog() {
    await this.auditContainer.createIfNotExists({
      access: 'private',
      metadata: { encrypted: 'true' }
    });
  }

  public async analyzePatientCondition(
    patientData: PatientRecord,
    vitalSigns: VitalSigns,
    priorVisits?: PatientRecord[]
  ): Promise<MedicalAnalysisResult> {
    const startTime = Date.now();
    const inputHash = await this.hashInput(patientData);

    try {
      // Primary analysis with Claude
      const primaryAnalysis = await this.performClaudeAnalysis(patientData, vitalSigns);
      
      // Verification with secondary model for critical cases
      if (primaryAnalysis.priority === 'critical') {
        const verificationAnalysis = await this.performVerificationAnalysis(patientData, vitalSigns);
        if (verificationAnalysis.priority !== 'critical') {
          await this.logDiscrepancy(primaryAnalysis, verificationAnalysis);
        }
      }

      // Enrich with medical codes and standards
      const enrichedAnalysis = await this.enrichWithMedicalStandards(primaryAnalysis);

      // Generate HL7 message if needed
      if (process.env.ENABLE_HL7_INTEGRATION === 'true') {
        await this.generateHL7Message(enrichedAnalysis);
      }

      // Log the analysis for audit
      await this.logAnalysis({
        inputHash,
        analysis: enrichedAnalysis,
        duration: Date.now() - startTime
      });

      return enrichedAnalysis;

    } catch (error) {
      await this.handleAnalysisError(error, inputHash);
      throw error;
    }
  }

  private async performClaudeAnalysis(
    patientData: PatientRecord,
    vitalSigns: VitalSigns
  ): Promise<MedicalAnalysisResult> {
    const prompt = this.buildClinicalPrompt(patientData, vitalSigns);
    
    const response = await claude.complete({
      prompt,
      model: 'claude-2',
      max_tokens: 1500,
      temperature: 0.1, // Low temperature for consistent medical analysis
      stop_sequences: ['[end]'],
    });

    return this.parseClaudeResponse(response);
  }

  private async performVerificationAnalysis(
    patientData: PatientRecord,
    vitalSigns: VitalSigns
  ): Promise<MedicalAnalysisResult> {
    // Secondary verification for critical cases
    const response = await openai.createCompletion({
      model: 'gpt-4',
      prompt: this.buildVerificationPrompt(patientData, vitalSigns),
      temperature: 0.1,
      max_tokens: 1000,
    });

    return this.parseVerificationResponse(response);
  }

  private async enrichWithMedicalStandards(
    analysis: MedicalAnalysisResult
  ): Promise<MedicalAnalysisResult> {
    // Add ICD-10 codes
    analysis.icdCodes = await this.getRelevantICDCodes(analysis);
    
    // Add SNOMED CT codes
    analysis.snomedCodes = await this.getRelevantSNOMEDCodes(analysis);
    
    // Add clinical practice guidelines
    analysis.recommendedTests = await this.getRecommendedTests(analysis);

    return analysis;
  }

  private async logAnalysis(data: any) {
    const blobName = `${new Date().toISOString()}-${data.inputHash}.json`;
    const blockBlobClient = this.auditContainer.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(
      JSON.stringify(data),
      JSON.stringify(data).length,
      {
        metadata: {
          encrypted: 'true',
          classification: 'phi',
          retention: 'seven-years'
        }
      }
    );
  }

  private async hashInput(data: any): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private buildClinicalPrompt(
    patientData: PatientRecord,
    vitalSigns: VitalSigns
  ): string {
    return `[Medical Analysis Request]
Patient Presentation:
- Symptoms: ${patientData.symptoms}
- Vital Signs: BP ${vitalSigns.bloodPressure}, HR ${vitalSigns.heartRate}, RR ${vitalSigns.respiratoryRate}, T ${vitalSigns.temperature}
- Medical History: ${patientData.medicalHistory}
- Allergies: ${patientData.allergies?.join(', ')}
- Current Medications: ${patientData.currentMedications?.join(', ')}

Required Analysis:
1. Triage Priority Assessment
2. Primary Medical Concerns
3. Differential Diagnosis
4. Recommended Immediate Actions
5. Specialist Referral Requirements
6. Risk Assessment

Format response as detailed medical assessment with clear clinical reasoning.
[end]`;
  }

  private async getRelevantICDCodes(analysis: MedicalAnalysisResult): Promise<string[]> {
    // Implementation for ICD-10 code lookup
    return [];
  }

  private async getRelevantSNOMEDCodes(analysis: MedicalAnalysisResult): Promise<string[]> {
    // Implementation for SNOMED CT code lookup
    return [];
  }

  private async getRecommendedTests(analysis: MedicalAnalysisResult): Promise<string[]> {
    // Implementation for clinical practice guidelines
    return [];
  }

  private async generateHL7Message(analysis: MedicalAnalysisResult): Promise<void> {
    const hl7Message = new HL7Message({
      type: 'REF',
      priority: analysis.priority,
      diagnosis: analysis.differentialDiagnosis,
      icdCodes: analysis.icdCodes
    });

    await hl7Message.send();
  }

  private async handleAnalysisError(error: any, inputHash: string): Promise<void> {
    // Log error for audit
    await this.logAnalysis({
      inputHash,
      error: error.message,
      timestamp: new Date().toISOString(),
      type: 'error'
    });

    // Alert monitoring system if needed
    if (error.critical) {
      await this.alertMonitoring(error);
    }
  }

  private async alertMonitoring(error: any): Promise<void> {
    // Implementation for alerting monitoring systems
  }
}
