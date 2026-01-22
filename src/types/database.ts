// ESTE ARQUIVO REPRESENTA A ESTRUTURA REAL DO BANCO DE DADOS (DIRECTUS)

// Tabela: salas_azul
export interface SalaAzulDB {
  id: number;
  status: string;
  nome_ciclo: string; // No banco é nome_ciclo
  data_inicio: string;
  data_termino: string; // No banco é data_termino
  local_id: number | { id: number; nome: string } | null; // Pode vir expandido ou ID
  responsavel_tecnico:
    | string
    | { id: string; first_name: string; last_name: string }
    | null;
  facilitador?: string; // Campo legado ou auxiliar
}

// Tabela: infratores
export interface InfratorDB {
  id: number;
  nome_completo: string;
  cpf: string;
  data_nascimento?: string;
  nivel_id: number | { id: number; nome: string; cor: string };
  status_legal_id: number | { id: number; nome: string };
}

// Tabela: participacoes_sala_azul
export interface ParticipacaoDB {
  id: number;
  sala: number | SalaAzulDB;
  infrator: number | InfratorDB;
  status_participacao: string;
  frequencia_percentual: number;
}

// --- MÓDULO ESCOLA ---

export interface EscolaCursoDB {
  id: number;
  nome: string;
  descricao?: string;
  carga_horaria?: number;
  status: string; // 'ativo' | 'inativo'
}

export interface EscolaTurmaDB {
  id: number;
  nome: string;
  curso_id: number | EscolaCursoDB; // Pode vir ID ou Objeto
  data_inicio: string;
  data_fim: string;
  turno: string; // 'manha' | 'tarde' | 'noite'
  status: string;
  capacidade_maxima: number;
  sala_aula?: string;
}

export interface EscolaAlunoDB {
  id: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  status: string; // 'ativo' | 'trancado' | 'concluido'
  foto?: string; // UUID do Directus File
}

export interface EscolaMatriculaDB {
  id: number;
  aluno_id: number | EscolaAlunoDB;
  turma_id: number | EscolaTurmaDB;
  data_matricula: string;
  status: string; // 'cursando' | 'aprovado' | 'reprovado'
  nota_final?: number;
  frequencia_percentual?: number;
}
