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
  area_atuacao?: string;
  ementa?: string;
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

// --- MODULO MULHERES ---

export interface MulheresBeneficiariaDB {
  id: number;
  nome_completo: string;
  nome_social?: string;
  data_nascimento: string;
  cpf?: string;
  rg?: string;
  telefone?: string;
  contato: {
    telefone: string;
    email?: string;
  };
  endereco_completo?: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
  };
  bairro?: string; // Pode ser string ou ID de config_bairros dependendo da sua implementacao
  perfil_socioeconomico?: string;
  recebe_bolsa_familia?: boolean;
  recebe_bpc?: boolean;
  possui_medida_protetiva?: boolean;
  historico_violencia?: string;
  status: string; // 'ativa' | 'arquivada'
  foto?: string;
}

export interface MulheresAtendimentoDB {
  id: number;
  beneficiaria_id: number | MulheresBeneficiariaDB;
  beneficiaria?: number | MulheresBeneficiariaDB; // Campo usado no formulario/schema
  data_atendimento?: string;
  data_abertura: string;
  origem_id?: number;
  prioridade_id?: number;
  encaminhamento_id?: number;
  tecnico_responsavel?: string;
  tipo_demanda?: string; // ex: 'psicologico', 'juridico'
  relato_sumario?: string;
  encaminhamentos?: Array<string | number>;
  tipos_violencia?: number[] | string[] | string;
  status: string; // 'Aberto' | 'Em andamento' | 'Concluido' | 'Arquivado' | variantes legadas
}

// --- APP AMAR ---

export interface AmarCategoria {
  id: string;
  nome: string;
  slug: string;
  icone?: string;
  cor_hex?: string;
  ordem?: number;
  status: string;
}

export type AmarCategorias = AmarCategoria;

export interface AmarServico {
  id: string;
  titulo: string;
  slug: string;
  descricao_curta?: string;
  documentos_necessarios?: string;
  endereco_mapa?: string;
  horario_atendimento?: string;
  link_externo_acao?: string;
  status: string;
  categoria_id: string | AmarCategoria;
}

export interface AmarCampanha {
  id: string;
  titulo: string;
  url_instagram: string;
  status: string;
}

export interface AmarSonhos {
  id: number;
  nome?: string;
  telefone?: string;
  cpf?: string;
  audio?: string;
  date_created?: string;
}

export interface AmarCursos {
  id: string;
  status: string;
  titulo: string;
  descricao: string;
  categoria: string | AmarCategorias;
  imagem_capa: string;
  carga_horaria: number;
  instrutor: string;
  user_created: string;
  date_created: string;
}

export interface AmarContatos {
  id: string;
  status: string;
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  lido: boolean;
  date_created: string;
}

export interface AmarProjetos {
  id: string;
  status: string;
  titulo: string;
  descricao: string;
  conteudo: string;
  imagem_capa: string;
  user_created: string;
  date_created: string;
}

export interface Database {
  amar_categorias: AmarCategoria[];
  amar_servicos: AmarServico[];
  amar_campanhas: AmarCampanha[];
  amar_sonhos: AmarSonhos[];
  amar_cursos: AmarCursos[];
  amar_contatos: AmarContatos[];
  amar_projetos: AmarProjetos[];
}

export interface DirectusSchema extends Database {
  [collection: string]: any;
}
