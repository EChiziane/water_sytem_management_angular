export interface Teacher {
  id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  type: 'HEAD_TEACHER, ASSISTANT'; // ou conforme definido no enum TeacherType do backend
  createdAt?: string;
}
