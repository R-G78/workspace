export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  department: string;
  status: 'active' | 'inactive' | 'on_leave';
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}
