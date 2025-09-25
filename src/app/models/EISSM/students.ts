export interface Student {
  id: string;
  nome: string;
  numeroEstudante: string;
  bi: string;
  dataNascimento: string; // ISO string format
  endereco: string;
  nivelAcademico: string;
  ultimoNivelIngles: 'A1' |'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}
