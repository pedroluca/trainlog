// Exercise Library Database
// Can be extended with images, videos, and more details

export type MuscleGroup = 
  | 'Peito'
  | 'Costas'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Pernas'
  | 'Quadríceps'
  | 'Posteriores'
  | 'Glúteos'
  | 'Panturrilha'
  | 'Abdômen'
  | 'Antebraço'

export type Equipment = 
  | 'Barra'
  | 'Halteres'
  | 'Máquina'
  | 'Cabo'
  | 'Peso Corporal'
  | 'Kettlebell'
  | 'Elástico'

export interface Exercise {
  id: string
  nome: string
  musculos: MuscleGroup[]
  equipamento: Equipment
  instrucoes?: string
  dificuldade: 'Iniciante' | 'Intermediário' | 'Avançado'
}

export const exerciseLibrary: Exercise[] = [
  // PEITO
  {
    id: 'supino-reto',
    nome: 'Supino Reto',
    musculos: ['Peito', 'Tríceps', 'Ombros'],
    equipamento: 'Barra',
    instrucoes: 'Deitado no banco, desça a barra até o peito e empurre de volta',
    dificuldade: 'Intermediário'
  },
  {
    id: 'supino-inclinado',
    nome: 'Supino Inclinado',
    musculos: ['Peito', 'Ombros', 'Tríceps'],
    equipamento: 'Barra',
    instrucoes: 'Similar ao supino reto, mas com banco inclinado 30-45°',
    dificuldade: 'Intermediário'
  },
  {
    id: 'supino-declinado',
    nome: 'Supino Declinado',
    musculos: ['Peito', 'Tríceps'],
    equipamento: 'Barra',
    instrucoes: 'Banco declinado, foco na parte inferior do peito',
    dificuldade: 'Intermediário'
  },
  {
    id: 'crucifixo-reto',
    nome: 'Crucifixo Reto',
    musculos: ['Peito'],
    equipamento: 'Halteres',
    instrucoes: 'Abra os braços com halteres, cotovelos levemente flexionados',
    dificuldade: 'Iniciante'
  },
  {
    id: 'crucifixo-inclinado',
    nome: 'Crucifixo Inclinado',
    musculos: ['Peito', 'Ombros'],
    equipamento: 'Halteres',
    instrucoes: 'Crucifixo em banco inclinado, foca peito superior',
    dificuldade: 'Iniciante'
  },
  {
    id: 'flexao',
    nome: 'Flexão de Braço',
    musculos: ['Peito', 'Tríceps', 'Ombros'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Clássico exercício de peso corporal',
    dificuldade: 'Iniciante'
  },

  // COSTAS
  {
    id: 'barra-fixa',
    nome: 'Barra Fixa',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Pegada pronada, puxe até o queixo passar a barra',
    dificuldade: 'Intermediário'
  },
  {
    id: 'remada-curvada',
    nome: 'Remada Curvada',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Barra',
    instrucoes: 'Incline o tronco e puxe a barra até o abdômen',
    dificuldade: 'Intermediário'
  },
  {
    id: 'puxada-alta',
    nome: 'Puxada Alta',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Cabo',
    instrucoes: 'Sentado, puxe a barra até a altura do peito',
    dificuldade: 'Iniciante'
  },
  {
    id: 'remada-sentada',
    nome: 'Remada Sentada',
    musculos: ['Costas', 'Bíceps'],
    equipamento: 'Cabo',
    instrucoes: 'Sentado, puxe o cabo até o abdômen',
    dificuldade: 'Iniciante'
  },
  {
    id: 'pullover',
    nome: 'Pullover',
    musculos: ['Costas', 'Peito'],
    equipamento: 'Halteres',
    instrucoes: 'Deitado, leve o halter por trás da cabeça e volte',
    dificuldade: 'Intermediário'
  },
  {
    id: 'levantamento-terra',
    nome: 'Levantamento Terra',
    musculos: ['Costas', 'Posteriores', 'Glúteos'],
    equipamento: 'Barra',
    instrucoes: 'Levante a barra do chão mantendo costas retas',
    dificuldade: 'Avançado'
  },

  // OMBROS
  {
    id: 'desenvolvimento-militar',
    nome: 'Desenvolvimento Militar',
    musculos: ['Ombros', 'Tríceps'],
    equipamento: 'Barra',
    instrucoes: 'Em pé, empurre a barra acima da cabeça',
    dificuldade: 'Intermediário'
  },
  {
    id: 'desenvolvimento-halteres',
    nome: 'Desenvolvimento com Halteres',
    musculos: ['Ombros', 'Tríceps'],
    equipamento: 'Halteres',
    instrucoes: 'Sentado, empurre halteres acima da cabeça',
    dificuldade: 'Iniciante'
  },
  {
    id: 'elevacao-lateral',
    nome: 'Elevação Lateral',
    musculos: ['Ombros'],
    equipamento: 'Halteres',
    instrucoes: 'Eleve halteres lateralmente até altura dos ombros',
    dificuldade: 'Iniciante'
  },
  {
    id: 'elevacao-frontal',
    nome: 'Elevação Frontal',
    musculos: ['Ombros'],
    equipamento: 'Halteres',
    instrucoes: 'Eleve halteres à frente até altura dos ombros',
    dificuldade: 'Iniciante'
  },
  {
    id: 'crucifixo-invertido',
    nome: 'Crucifixo Invertido',
    musculos: ['Ombros', 'Costas'],
    equipamento: 'Halteres',
    instrucoes: 'Inclinado, abra os braços lateralmente',
    dificuldade: 'Intermediário'
  },

  // BÍCEPS
  {
    id: 'rosca-direta',
    nome: 'Rosca Direta',
    musculos: ['Bíceps'],
    equipamento: 'Barra',
    instrucoes: 'Flexione os cotovelos levando a barra até o peito',
    dificuldade: 'Iniciante'
  },
  {
    id: 'rosca-alternada',
    nome: 'Rosca Alternada',
    musculos: ['Bíceps'],
    equipamento: 'Halteres',
    instrucoes: 'Alterne flexões de cotovelo com halteres',
    dificuldade: 'Iniciante'
  },
  {
    id: 'rosca-martelo',
    nome: 'Rosca Martelo',
    musculos: ['Bíceps', 'Antebraço'],
    equipamento: 'Halteres',
    instrucoes: 'Pegada neutra, flexione os cotovelos',
    dificuldade: 'Iniciante'
  },
  {
    id: 'rosca-scott',
    nome: 'Rosca Scott',
    musculos: ['Bíceps'],
    equipamento: 'Barra',
    instrucoes: 'No banco scott, isola o bíceps',
    dificuldade: 'Intermediário'
  },

  // TRÍCEPS
  {
    id: 'triceps-testa',
    nome: 'Tríceps Testa',
    musculos: ['Tríceps'],
    equipamento: 'Barra',
    instrucoes: 'Deitado, flexione apenas os cotovelos',
    dificuldade: 'Intermediário'
  },
  {
    id: 'triceps-corda',
    nome: 'Tríceps Corda',
    musculos: ['Tríceps'],
    equipamento: 'Cabo',
    instrucoes: 'Puxe a corda para baixo estendendo os cotovelos',
    dificuldade: 'Iniciante'
  },
  {
    id: 'triceps-frances',
    nome: 'Tríceps Francês',
    musculos: ['Tríceps'],
    equipamento: 'Halteres',
    instrucoes: 'Sentado ou em pé, leve halter atrás da cabeça',
    dificuldade: 'Intermediário'
  },
  {
    id: 'mergulho',
    nome: 'Mergulho',
    musculos: ['Tríceps', 'Peito'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Em paralelas, desça e suba o corpo',
    dificuldade: 'Intermediário'
  },

  // PERNAS - QUADRÍCEPS
  {
    id: 'agachamento-livre',
    nome: 'Agachamento Livre',
    musculos: ['Quadríceps', 'Glúteos', 'Posteriores'],
    equipamento: 'Barra',
    instrucoes: 'Com barra nas costas, desça até coxas paralelas',
    dificuldade: 'Intermediário'
  },
  {
    id: 'agachamento-frontal',
    nome: 'Agachamento Frontal',
    musculos: ['Quadríceps', 'Glúteos'],
    equipamento: 'Barra',
    instrucoes: 'Barra na frente dos ombros, agache',
    dificuldade: 'Avançado'
  },
  {
    id: 'leg-press',
    nome: 'Leg Press 45°',
    musculos: ['Quadríceps', 'Glúteos'],
    equipamento: 'Máquina',
    instrucoes: 'Empurre a plataforma com as pernas',
    dificuldade: 'Iniciante'
  },
  {
    id: 'cadeira-extensora',
    nome: 'Cadeira Extensora',
    musculos: ['Quadríceps'],
    equipamento: 'Máquina',
    instrucoes: 'Estenda as pernas contra resistência',
    dificuldade: 'Iniciante'
  },
  {
    id: 'afundo',
    nome: 'Afundo',
    musculos: ['Quadríceps', 'Glúteos'],
    equipamento: 'Halteres',
    instrucoes: 'Dê um passo à frente e desça',
    dificuldade: 'Iniciante'
  },

  // PERNAS - POSTERIORES
  {
    id: 'stiff',
    nome: 'Stiff',
    musculos: ['Posteriores', 'Glúteos'],
    equipamento: 'Barra',
    instrucoes: 'Pernas semi-retas, desça a barra até o chão',
    dificuldade: 'Intermediário'
  },
  {
    id: 'cadeira-flexora',
    nome: 'Cadeira Flexora',
    musculos: ['Posteriores'],
    equipamento: 'Máquina',
    instrucoes: 'Deitado, flexione as pernas',
    dificuldade: 'Iniciante'
  },
  {
    id: 'mesa-flexora',
    nome: 'Mesa Flexora',
    musculos: ['Posteriores'],
    equipamento: 'Máquina',
    instrucoes: 'De bruços, flexione as pernas',
    dificuldade: 'Iniciante'
  },

  // GLÚTEOS
  {
    id: 'gluteo-quatro-apoios',
    nome: 'Glúteo 4 Apoios',
    musculos: ['Glúteos'],
    equipamento: 'Peso Corporal',
    instrucoes: 'De quatro, eleve a perna para trás',
    dificuldade: 'Iniciante'
  },
  {
    id: 'elevacao-pelvica',
    nome: 'Elevação Pélvica',
    musculos: ['Glúteos', 'Posteriores'],
    equipamento: 'Barra',
    instrucoes: 'Deitado, eleve o quadril com barra',
    dificuldade: 'Iniciante'
  },
  {
    id: 'cadeira-abdutora',
    nome: 'Cadeira Abdutora',
    musculos: ['Glúteos'],
    equipamento: 'Máquina',
    instrucoes: 'Abra as pernas contra resistência',
    dificuldade: 'Iniciante'
  },

  // PANTURRILHA
  {
    id: 'panturrilha-em-pe',
    nome: 'Panturrilha em Pé',
    musculos: ['Panturrilha'],
    equipamento: 'Máquina',
    instrucoes: 'Eleve os calcanhares o máximo possível',
    dificuldade: 'Iniciante'
  },
  {
    id: 'panturrilha-sentado',
    nome: 'Panturrilha Sentado',
    musculos: ['Panturrilha'],
    equipamento: 'Máquina',
    instrucoes: 'Sentado, eleve os calcanhares',
    dificuldade: 'Iniciante'
  },

  // ABDÔMEN
  {
    id: 'abdominal-reto',
    nome: 'Abdominal Reto',
    musculos: ['Abdômen'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Deitado, eleve o tronco em direção aos joelhos',
    dificuldade: 'Iniciante'
  },
  {
    id: 'prancha',
    nome: 'Prancha',
    musculos: ['Abdômen'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Mantenha o corpo reto apoiado nos antebraços',
    dificuldade: 'Iniciante'
  },
  {
    id: 'abdominal-obliquo',
    nome: 'Abdominal Oblíquo',
    musculos: ['Abdômen'],
    equipamento: 'Peso Corporal',
    instrucoes: 'Rotação do tronco para trabalhar oblíquos',
    dificuldade: 'Iniciante'
  },
]

// Helper functions
export const searchExercises = (query: string): Exercise[] => {
  const lowerQuery = query.toLowerCase().trim()
  
  if (!lowerQuery) return exerciseLibrary
  
  return exerciseLibrary.filter(exercise => 
    exercise.nome.toLowerCase().includes(lowerQuery) ||
    exercise.musculos.some(musculo => musculo.toLowerCase().includes(lowerQuery)) ||
    exercise.equipamento.toLowerCase().includes(lowerQuery)
  )
}

export const getExercisesByMuscleGroup = (muscleGroup: MuscleGroup): Exercise[] => {
  return exerciseLibrary.filter(exercise => 
    exercise.musculos.includes(muscleGroup)
  )
}

export const getExercisesByEquipment = (equipment: Equipment): Exercise[] => {
  return exerciseLibrary.filter(exercise => 
    exercise.equipamento === equipment
  )
}

export const getMuscleGroups = (): MuscleGroup[] => {
  return Array.from(new Set(exerciseLibrary.flatMap(e => e.musculos)))
}
