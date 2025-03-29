export type trainingDataType = {
  muscles: string
  exercizes: Array<exercizeType>
}

type exercizeType = {
  title: string
  sets: number
  reps: number
  weight: number
  breakTime: number
}

export const trainingData = {
  "Domingo": {},
  "Segunda-feira": {
    muscles: 'Pernas e Ombros',
    exercizes: [
      {
        title: 'Cadeira Extensora',
        sets: 3,
        reps: 10,
        weight: 25,
        breakTime: 2
      },
      {
        title: 'Leg Press 45°',
        sets: 3,
        reps: 10,
        weight: 15,
        breakTime: 2
      },
      {
        title: 'Mesa Flexora',
        sets: 3,
        reps: 10,
        weight: 25,
        breakTime: 2
      },
      {
        title: 'Cadeira Flexora',
        sets: 3,
        reps: 10,
        weight: 25,
        breakTime: 2
      },
      {
        title: 'Cadeira Abdutora',
        sets: 3,
        reps: 15,
        weight: 30,
        breakTime: 2
      },
      {
        title: 'Desenvolvimento na Máquina',
        sets: 3,
        reps: 10,
        weight: 4,
        breakTime: 1.5
      },
      {
        title: 'Elevação Lateral com Halter',
        sets: 3,
        reps: 10,
        weight: 4,
        breakTime: 1
      },
      {
        title: 'Elevação Frontal com Barra Reta',
        sets: 3,
        reps: 10,
        weight: 10,
        breakTime: 1
      }
    ]
  },
  "Terça-feira": {},
  "Quarta-feira": {
    muscles: 'Costas e Bíceps',
    exercizes: [
      {
        title: 'Puxada Alta com Barra de Ponta Curva',
        sets: 3,
        reps: 10,
        weight: 25,
        breakTime: 1.5
      },
      {
        title: 'Remada Baixa com Triângulo',
        sets: 3,
        reps: 10,
        weight: 25,
        breakTime: 1.5
      },
      {
        title: 'Remada Articulada na Máquina',
        sets: 3,
        reps: 10,
        weight: 30,
        breakTime: 1
      },
      {
        title: 'Pulldown com Barra Reta',
        sets: 3,
        reps: 10,
        weight: 12.5,
        breakTime: 1.5
      },
      {
        title: 'Rosca Direta Bilateral com Halter',
        sets: 3,
        reps: 10,
        weight: 5,
        breakTime: 1
      },
      {
        title: 'Rosca Martelo Bilateral com Halter',
        sets: 3,
        reps: 10,
        weight: 5,
        breakTime: 1
      },
      {
        title: 'Rosca Concentrada Unilateral à Esquerda com Halter',
        sets: 4,
        reps: 4,
        weight: 8,
        breakTime: 1.5
      },
      {
        title: 'Rosca com Barra na Polia',
        sets: 3,
        reps: 10,
        weight: 5,
        breakTime: 1
      }
    ]
  },
  "Quinta-feira": {},
  "Sexta-feira": {
    muscles: 'Peito e Tríceps',
    exercizes: [
      {
        title: 'Manguito Rotador no Cross',
        sets: 3,
        reps: 20,
        weight: 5,
        breakTime: 1.5
      },
      {
        title: 'Supino Inclinado com Halter',
        sets: 3,
        reps: 15,
        weight: 5,
        breakTime: 1
      },
      {
        title: 'Supino Reto com Barra',
        sets: 3,
        reps: 15,
        weight: 10,
        breakTime: 1.5
      },
      {
        title: 'Crucifixo no Banco com Halter',
        sets: 4,
        reps: 15,
        weight: 4,
        breakTime: 1
      },
      {
        title: 'Voador de Peitoral na Máquina',
        sets: 4,
        reps: 10,
        weight: 25,
        breakTime: 1
      },
      {
        title: 'Tríceps Francês Bilateral com Halter',
        sets: 4,
        reps: 10,
        weight: 7,
        breakTime: 1.5
      },
      {
        title: 'Tríceps com Corda na Polia',
        sets: 3,
        reps: 10,
        weight: 10,
        breakTime: 1.5
      },
      {
        title: 'Tríceps com Barra V na Polia',
        sets: 3,
        reps: 10,
        weight: 10,
        breakTime: 1.5
      },
      {
        title: 'Tríceps Unilateral à Esquerda no Cross',
        sets: 4,
        reps: 4,
        weight: 12.5,
        breakTime: 1.5
      }
    ]
  },
  "Sábado": []
}