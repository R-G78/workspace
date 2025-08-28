import OpenAI from 'openai';
import type { Message } from '../types/chat';
import type { TriageResult } from '../types/triage';
import { CRITICAL_SYMPTOMS } from '../lib/constants';

class LLMService {
  private openai: OpenAI;
  private systemPrompt: string;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.systemPrompt = `You are an AI medical triage assistant. Your role is to:
1. Assess patient symptoms and medical history
2. Determine urgency and priority level
3. Recommend appropriate next steps
4. Estimate wait times based on severity

Provide responses in a clear, professional format.`;
  }

  async triagePatient(symptoms: string, medicalHistory?: string): Promise<TriageResult> {
    const messages: Message[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: `Patient Symptoms: ${symptoms}\nMedical History: ${medicalHistory || 'None provided'}` }
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.3
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from AI');

      // Check for critical symptoms
      const hasCriticalSymptoms = CRITICAL_SYMPTOMS.some(symptom => 
        symptoms.toLowerCase().includes(symptom.toLowerCase())
      );

      if (hasCriticalSymptoms) {
        return {
          priority: 'high',
          category: 'emergency',
          recommendedActions: ['Immediate medical attention required'],
          estimatedWaitTime: 0,
          requiresImmediateAttention: true,
          vitalSignsRequired: ['all'],
          reasoning: 'Critical symptoms detected - requires immediate attention'
        };
      }

      // Parse AI response and determine triage priority
      const isUrgent = response.toLowerCase().includes('urgent') || 
                      response.toLowerCase().includes('emergency');
      const isMedium = response.toLowerCase().includes('moderate') || 
                      response.toLowerCase().includes('soon');

      return {
        priority: isUrgent ? 'high' : isMedium ? 'medium' : 'low',
        category: this.determineCategory(response),
        recommendedActions: this.extractActions(response),
        estimatedWaitTime: this.calculateWaitTime(isUrgent, isMedium),
        requiresImmediateAttention: isUrgent,
        vitalSignsRequired: this.determineRequiredVitalSigns(response),
        reasoning: response
      };
    } catch (error) {
      console.error('Triage error:', error);
      return {
        priority: 'medium',
        category: 'general',
        recommendedActions: ['Please consult with medical staff'],
        estimatedWaitTime: 30,
        requiresImmediateAttention: false,
        vitalSignsRequired: ['temperature', 'blood_pressure', 'heart_rate'],
        reasoning: 'Error in AI triage - defaulting to medium priority'
      };
    }
  }

  private determineCategory(response: string): string {
    if (response.toLowerCase().includes('cardiac')) return 'cardiac';
    if (response.toLowerCase().includes('respiratory')) return 'respiratory';
    if (response.toLowerCase().includes('trauma')) return 'trauma';
    if (response.toLowerCase().includes('neurological')) return 'neurological';
    return 'general';
  }

  private extractActions(response: string): string[] {
    const actions: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') || 
          line.toLowerCase().includes('should') || 
          line.toLowerCase().includes('need')) {
        actions.push(line.trim());
      }
    }

    return actions.length > 0 ? actions : ['Consult with medical staff'];
  }

  private calculateWaitTime(isUrgent: boolean, isMedium: boolean): number {
    if (isUrgent) return 0;
    if (isMedium) return 30;
    return 60;
  }

  private determineRequiredVitalSigns(response: string): string[] {
    const vitalSigns: string[] = ['temperature', 'blood_pressure'];
    
    if (response.toLowerCase().includes('heart')) vitalSigns.push('heart_rate');
    if (response.toLowerCase().includes('breath')) vitalSigns.push('respiratory_rate');
    if (response.toLowerCase().includes('oxygen')) vitalSigns.push('oxygen_saturation');
    
    return vitalSigns;
  }
}

export default LLMService;
