import { MedicalAIService } from './medical-ai-service';
import { PatientRecord, ClinicalAssessment, VitalSigns } from '@/types/medical';
import { EventEmitter } from 'events';

interface ActionPlan {
  actions: Array<{
    type: 'triage' | 'alert' | 'referral' | 'test' | 'medication' | 'monitoring';
    priority: 'immediate' | 'urgent' | 'routine';
    description: string;
    assignedTo?: string;
    deadline?: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
  }>;
  reasoning: string[];
  dependencies: string[];
  estimatedCompletionTime: Date;
}

interface AgentState {
  currentPatients: Map<string, PatientRecord>;
  activeAlerts: Set<string>;
  pendingActions: Map<string, ActionPlan>;
  monitoringThresholds: Map<string, number>;
  lastAssessments: Map<string, ClinicalAssessment>;
}

export class MedicalAgent extends EventEmitter {
  private static instance: MedicalAgent;
  private aiService: MedicalAIService;
  private state: AgentState;
  private monitoringInterval: NodeJS.Timer;
  private readonly MONITORING_FREQUENCY = 60000; // 1 minute

  private constructor() {
    super();
    this.aiService = MedicalAIService.getInstance();
    this.state = this.initializeState();
    this.startMonitoring();
  }

  public static getInstance(): MedicalAgent {
    if (!MedicalAgent.instance) {
      MedicalAgent.instance = new MedicalAgent();
    }
    return MedicalAgent.instance;
  }

  private initializeState(): AgentState {
    return {
      currentPatients: new Map(),
      activeAlerts: new Set(),
      pendingActions: new Map(),
      monitoringThresholds: new Map(),
      lastAssessments: new Map()
    };
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.monitorAllPatients();
    }, this.MONITORING_FREQUENCY);
  }

  public async handleNewPatient(patient: PatientRecord): Promise<ActionPlan> {
    try {
      // 1. Initial Assessment
      const assessment = await this.performInitialAssessment(patient);
      
      // 2. Create Action Plan
      const plan = await this.createActionPlan(patient, assessment);
      
      // 3. Execute Immediate Actions
      await this.executeImmediateActions(plan);
      
      // 4. Set up Monitoring
      this.setupPatientMonitoring(patient);
      
      // 5. Update State
      this.state.currentPatients.set(patient.id, patient);
      this.state.pendingActions.set(patient.id, plan);

      return plan;
    } catch (error) {
      this.handleError('newPatient', error, patient.id);
      throw error;
    }
  }

  public async handleVitalSignsUpdate(
    patientId: string,
    vitalSigns: VitalSigns
  ): Promise<void> {
    const patient = this.state.currentPatients.get(patientId);
    if (!patient) return;

    try {
      // 1. Analyze Vital Signs
      const analysis = await this.analyzeVitalSigns(vitalSigns, patient);
      
      // 2. Check for Critical Changes
      if (this.isCriticalChange(analysis)) {
        await this.handleCriticalChange(patient, analysis);
      }

      // 3. Update Monitoring Plan
      this.updateMonitoringPlan(patient, analysis);
      
      // 4. Log Changes
      this.logVitalSignsChange(patient, vitalSigns, analysis);
    } catch (error) {
      this.handleError('vitalSigns', error, patientId);
    }
  }

  private async performInitialAssessment(
    patient: PatientRecord
  ): Promise<ClinicalAssessment> {
    // Get AI analysis
    const aiAnalysis = await this.aiService.analyzePatientCondition(
      patient,
      patient.vitalSigns || {}
    );

    // Create clinical assessment
    const assessment: ClinicalAssessment = {
      primaryDiagnosis: aiAnalysis.differentialDiagnosis?.[0],
      differentialDiagnosis: aiAnalysis.differentialDiagnosis,
      severity: this.mapPriorityToSeverity(aiAnalysis.priority),
      recommendedActions: [],
      clinicalReasoning: aiAnalysis.reasoningChain.join('\n'),
      followUpNeeded: aiAnalysis.priority !== 'low'
    };

    // Store assessment
    this.state.lastAssessments.set(patient.id, assessment);
    
    return assessment;
  }

  private async createActionPlan(
    patient: PatientRecord,
    assessment: ClinicalAssessment
  ): Promise<ActionPlan> {
    const plan: ActionPlan = {
      actions: [],
      reasoning: [],
      dependencies: [],
      estimatedCompletionTime: new Date()
    };

    // Add immediate actions based on severity
    if (assessment.severity === 'critical') {
      plan.actions.push({
        type: 'alert',
        priority: 'immediate',
        description: 'Notify emergency response team',
        status: 'pending'
      });
    }

    // Add required tests
    if (assessment.requiredTests) {
      assessment.requiredTests.forEach(test => {
        plan.actions.push({
          type: 'test',
          priority: assessment.severity === 'critical' ? 'immediate' : 'urgent',
          description: `Perform ${test}`,
          status: 'pending'
        });
      });
    }

    // Add monitoring actions
    plan.actions.push({
      type: 'monitoring',
      priority: 'routine',
      description: 'Continuous vital signs monitoring',
      status: 'pending'
    });

    // Set estimated completion time
    plan.estimatedCompletionTime = this.calculateEstimatedCompletionTime(plan.actions);

    return plan;
  }

  private async executeImmediateActions(plan: ActionPlan): Promise<void> {
    const immediateActions = plan.actions.filter(a => a.priority === 'immediate');
    
    for (const action of immediateActions) {
      try {
        switch (action.type) {
          case 'alert':
            await this.sendAlert(action);
            break;
          case 'referral':
            await this.makeReferral(action);
            break;
          case 'test':
            await this.orderTest(action);
            break;
          default:
            console.warn(`Unknown immediate action type: ${action.type}`);
        }
        action.status = 'completed';
      } catch (error) {
        action.status = 'failed';
        this.handleError('immediateAction', error, action.type);
      }
    }
  }

  private setupPatientMonitoring(patient: PatientRecord): void {
    // Set monitoring thresholds based on condition
    const thresholds = this.calculateMonitoringThresholds(patient);
    this.state.monitoringThresholds.set(patient.id, thresholds);

    // Start continuous monitoring
    this.emit('monitoringStarted', {
      patientId: patient.id,
      thresholds,
      frequency: this.MONITORING_FREQUENCY
    });
  }

  private async monitorAllPatients(): Promise<void> {
    for (const [patientId, patient] of this.state.currentPatients) {
      try {
        // Check vital signs against thresholds
        const thresholds = this.state.monitoringThresholds.get(patientId);
        if (!thresholds) continue;

        const vitalSigns = await this.getCurrentVitalSigns(patientId);
        if (this.isAboveThreshold(vitalSigns, thresholds)) {
          await this.handleThresholdExceedance(patient, vitalSigns);
        }

        // Check pending actions
        await this.checkPendingActions(patientId);

      } catch (error) {
        this.handleError('monitoring', error, patientId);
      }
    }
  }

  private async handleThresholdExceedance(
    patient: PatientRecord,
    vitalSigns: VitalSigns
  ): Promise<void> {
    // Create alert
    const alertId = `${patient.id}-${Date.now()}`;
    this.state.activeAlerts.add(alertId);

    // Notify medical team
    this.emit('thresholdExceeded', {
      patientId: patient.id,
      vitalSigns,
      timestamp: new Date().toISOString()
    });

    // Request new assessment
    const newAssessment = await this.performInitialAssessment(patient);
    
    // Update action plan if needed
    if (this.requiresNewActionPlan(newAssessment)) {
      const newPlan = await this.createActionPlan(patient, newAssessment);
      await this.executeImmediateActions(newPlan);
      this.state.pendingActions.set(patient.id, newPlan);
    }
  }

  private mapPriorityToSeverity(
    priority: 'critical' | 'high' | 'medium' | 'low'
  ): 'critical' | 'severe' | 'moderate' | 'mild' {
    const mapping = {
      critical: 'critical',
      high: 'severe',
      medium: 'moderate',
      low: 'mild'
    } as const;
    return mapping[priority];
  }

  private calculateEstimatedCompletionTime(actions: any[]): Date {
    const now = new Date();
    const totalEstimatedMinutes = actions.reduce((total, action) => {
      const estimatedMinutes = {
        immediate: 15,
        urgent: 60,
        routine: 240
      }[action.priority] || 60;
      return total + estimatedMinutes;
    }, 0);

    return new Date(now.getTime() + totalEstimatedMinutes * 60000);
  }

  private handleError(context: string, error: any, id: string): void {
    this.emit('error', {
      context,
      error: error.message,
      id,
      timestamp: new Date().toISOString()
    });
  }

  // Additional helper methods...
  private async getCurrentVitalSigns(patientId: string): Promise<VitalSigns> {
    // Implementation for getting current vital signs
    return {};
  }

  private isAboveThreshold(vitalSigns: VitalSigns, thresholds: number): boolean {
    // Implementation for threshold checking
    return false;
  }

  private calculateMonitoringThresholds(patient: PatientRecord): number {
    // Implementation for calculating monitoring thresholds
    return 0;
  }

  private requiresNewActionPlan(assessment: ClinicalAssessment): boolean {
    // Implementation for determining if new action plan is needed
    return false;
  }

  private async sendAlert(action: any): Promise<void> {
    // Implementation for sending alerts
  }

  private async makeReferral(action: any): Promise<void> {
    // Implementation for making referrals
  }

  private async orderTest(action: any): Promise<void> {
    // Implementation for ordering tests
  }

  private async analyzeVitalSigns(
    vitalSigns: VitalSigns,
    patient: PatientRecord
  ): Promise<any> {
    const analysis = await this.aiService.analyzePatientCondition(
      patient,
      vitalSigns
    );

    return {
      ...analysis,
      trends: this.calculateVitalSignsTrends(patient.id, vitalSigns),
      alerts: this.checkVitalSignsAlerts(vitalSigns)
    };
  }

  private calculateVitalSignsTrends(
    patientId: string,
    currentVitalSigns: VitalSigns
  ): any {
    // Implementation for calculating vital signs trends
    return {};
  }

  private checkVitalSignsAlerts(vitalSigns: VitalSigns): string[] {
    const alerts: string[] = [];

    // Check blood pressure
    if (vitalSigns.bloodPressure) {
      const [systolic, diastolic] = vitalSigns.bloodPressure.split('/').map(Number);
      if (systolic > 180 || diastolic > 120) {
        alerts.push('CRITICAL: Severe hypertension');
      } else if (systolic < 90 || diastolic < 60) {
        alerts.push('CRITICAL: Hypotension');
      }
    }

    // Check heart rate
    if (vitalSigns.heartRate) {
      if (vitalSigns.heartRate > 150) {
        alerts.push('CRITICAL: Severe tachycardia');
      } else if (vitalSigns.heartRate < 40) {
        alerts.push('CRITICAL: Severe bradycardia');
      }
    }

    // Check oxygen saturation
    if (vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation < 90) {
      alerts.push('CRITICAL: Low oxygen saturation');
    }

    return alerts;
  }

  private isCriticalChange(analysis: any): boolean {
    return analysis.alerts?.some((alert: string) => alert.startsWith('CRITICAL'));
  }

  private async handleCriticalChange(
    patient: PatientRecord,
    analysis: any
  ): Promise<void> {
    // 1. Create high-priority alert
    const alertId = `CRITICAL-${patient.id}-${Date.now()}`;
    this.state.activeAlerts.add(alertId);

    // 2. Notify emergency response team
    this.emit('criticalChange', {
      patientId: patient.id,
      analysis,
      timestamp: new Date().toISOString()
    });

    // 3. Update patient status
    patient.status = 'in_progress';
    this.state.currentPatients.set(patient.id, patient);

    // 4. Create emergency action plan
    const assessment = await this.performInitialAssessment(patient);
    const emergencyPlan = await this.createActionPlan(patient, assessment);
    
    // 5. Execute immediate actions
    await this.executeImmediateActions(emergencyPlan);
  }

  private updateMonitoringPlan(
    patient: PatientRecord,
    analysis: any
  ): void {
    // Update monitoring thresholds based on new analysis
    const newThresholds = this.calculateMonitoringThresholds(patient);
    this.state.monitoringThresholds.set(patient.id, newThresholds);

    // Adjust monitoring frequency if needed
    if (analysis.alerts?.length > 0) {
      // Increase monitoring frequency for patients with active alerts
      this.emit('updateMonitoringFrequency', {
        patientId: patient.id,
        frequency: this.MONITORING_FREQUENCY / 2 // Double the frequency
      });
    }
  }

  private logVitalSignsChange(
    patient: PatientRecord,
    vitalSigns: VitalSigns,
    analysis: any
  ): void {
    this.emit('vitalSignsUpdate', {
      patientId: patient.id,
      vitalSigns,
      analysis,
      timestamp: new Date().toISOString()
    });
  }

  private async checkPendingActions(patientId: string): Promise<void> {
    const plan = this.state.pendingActions.get(patientId);
    if (!plan) return;

    // Check and update status of each pending action
    for (const action of plan.actions) {
      if (action.status === 'pending' || action.status === 'in_progress') {
        await this.updateActionStatus(action);
      }
    }

    // Check if plan is completed
    if (plan.actions.every(action => action.status === 'completed')) {
      this.state.pendingActions.delete(patientId);
      this.emit('planCompleted', {
        patientId,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async updateActionStatus(action: any): Promise<void> {
    // Implementation for updating action status
    // This would integrate with various hospital systems
  }
}
