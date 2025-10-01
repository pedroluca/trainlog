/**
 * Script to seed workout templates into Firestore
 * Run with: pnpm seed-templates
 * 
 * This will create 6 template workouts with exercises that users can clone
 */

import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'

// Your Firebase config - using process.env for Node.js scripts
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Template workouts with exercises
const templates = [
  {
    nome: 'Push A - Peito Foco',
    dia: 'Template',
    musculo: 'Peito, Ombros e Tríceps',
    usuarioID: 'system',
    exercicios: [
      { titulo: 'Supino Reto', series: 4, repeticoes: 8, peso: 60, tempoIntervalo: 120, isFeito: false },
      { titulo: 'Supino Inclinado', series: 4, repeticoes: 10, peso: 50, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Crucifixo Reto', series: 3, repeticoes: 12, peso: 15, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Desenvolvimento Militar', series: 3, repeticoes: 10, peso: 40, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Elevação Lateral', series: 3, repeticoes: 12, peso: 10, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Tríceps Corda', series: 3, repeticoes: 12, peso: 20, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Tríceps Testa', series: 3, repeticoes: 12, peso: 25, tempoIntervalo: 60, isFeito: false },
    ]
  },
  {
    nome: 'Pull A - Costas Completo',
    dia: 'Template',
    musculo: 'Costas e Bíceps',
    usuarioID: 'system',
    exercicios: [
      { titulo: 'Barra Fixa', series: 4, repeticoes: 8, peso: 0, tempoIntervalo: 120, isFeito: false },
      { titulo: 'Remada Curvada', series: 4, repeticoes: 10, peso: 50, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Puxada Alta', series: 3, repeticoes: 12, peso: 40, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Remada Sentada', series: 3, repeticoes: 12, peso: 40, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Pullover', series: 3, repeticoes: 12, peso: 20, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Rosca Direta', series: 3, repeticoes: 10, peso: 20, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Rosca Martelo', series: 3, repeticoes: 12, peso: 15, tempoIntervalo: 60, isFeito: false },
    ]
  },
  {
    nome: 'Legs A - Completo',
    dia: 'Template',
    musculo: 'Pernas e Glúteos',
    usuarioID: 'system',
    exercicios: [
      { titulo: 'Agachamento Livre', series: 4, repeticoes: 8, peso: 80, tempoIntervalo: 180, isFeito: false },
      { titulo: 'Leg Press 45°', series: 4, repeticoes: 12, peso: 200, tempoIntervalo: 120, isFeito: false },
      { titulo: 'Cadeira Extensora', series: 3, repeticoes: 15, peso: 40, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Cadeira Flexora', series: 3, repeticoes: 15, peso: 30, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Stiff', series: 3, repeticoes: 12, peso: 50, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Cadeira Abdutora', series: 3, repeticoes: 15, peso: 30, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Panturrilha em Pé', series: 4, repeticoes: 20, peso: 50, tempoIntervalo: 45, isFeito: false },
    ]
  },
  {
    nome: 'Upper Body A',
    dia: 'Template',
    musculo: 'Superiores Completo',
    usuarioID: 'system',
    exercicios: [
      { titulo: 'Supino Reto', series: 4, repeticoes: 8, peso: 60, tempoIntervalo: 120, isFeito: false },
      { titulo: 'Remada Curvada', series: 4, repeticoes: 10, peso: 50, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Desenvolvimento', series: 3, repeticoes: 10, peso: 40, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Puxada Alta', series: 3, repeticoes: 12, peso: 40, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Tríceps Corda', series: 3, repeticoes: 12, peso: 20, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Rosca Direta', series: 3, repeticoes: 10, peso: 20, tempoIntervalo: 60, isFeito: false },
    ]
  },
  {
    nome: 'Lower Body A',
    dia: 'Template',
    musculo: 'Inferiores Completo',
    usuarioID: 'system',
    exercicios: [
      { titulo: 'Agachamento Livre', series: 4, repeticoes: 10, peso: 80, tempoIntervalo: 180, isFeito: false },
      { titulo: 'Leg Press', series: 4, repeticoes: 12, peso: 200, tempoIntervalo: 120, isFeito: false },
      { titulo: 'Stiff', series: 3, repeticoes: 12, peso: 50, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Cadeira Extensora', series: 3, repeticoes: 15, peso: 40, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Cadeira Flexora', series: 3, repeticoes: 15, peso: 30, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Panturrilha', series: 4, repeticoes: 20, peso: 50, tempoIntervalo: 45, isFeito: false },
    ]
  },
  {
    nome: 'Full Body Iniciante',
    dia: 'Template',
    musculo: 'Corpo Inteiro',
    usuarioID: 'system',
    exercicios: [
      { titulo: 'Agachamento', series: 3, repeticoes: 12, peso: 40, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Supino Reto', series: 3, repeticoes: 12, peso: 40, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Remada Sentada', series: 3, repeticoes: 12, peso: 30, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Desenvolvimento', series: 3, repeticoes: 10, peso: 30, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Leg Press', series: 3, repeticoes: 15, peso: 100, tempoIntervalo: 90, isFeito: false },
      { titulo: 'Rosca Direta', series: 2, repeticoes: 12, peso: 15, tempoIntervalo: 60, isFeito: false },
      { titulo: 'Tríceps Corda', series: 2, repeticoes: 12, peso: 15, tempoIntervalo: 60, isFeito: false },
    ]
  },
]

async function seedTemplates() {
  console.log('🌱 Starting template seeding...\n')

  const createdTemplates: { id: string; nome: string }[] = []

  try {
    for (const template of templates) {
      console.log(`📋 Creating template: ${template.nome}`)

      // Create the workout document
      const treinoRef = await addDoc(collection(db, 'treinos'), {
        nome: template.nome,
        dia: template.dia,
        musculo: template.musculo,
        usuarioID: template.usuarioID,
        criadoEm: new Date().toISOString(),
      })

      console.log(`   ✅ Workout created with ID: ${treinoRef.id}`)

      // Add exercises to the workout
      const exerciciosRef = collection(db, 'treinos', treinoRef.id, 'exercicios')
      
      for (const exercicio of template.exercicios) {
        await addDoc(exerciciosRef, exercicio)
      }

      console.log(`   ✅ Added ${template.exercicios.length} exercises`)

      createdTemplates.push({
        id: `${treinoRef.id}-system`,
        nome: template.nome
      })

      console.log('')
    }

    console.log('✅ All templates created successfully!\n')
    console.log('📝 Update your workout-templates.ts file with these IDs:\n')
    console.log('export const workoutTemplates: WorkoutTemplate[] = [')
    
    createdTemplates.forEach((template, index) => {
      const categoria = index < 3 ? 'push_pull_legs' : index < 5 ? 'upper_lower' : 'full_body'
      const icons = ['💪', '🔙', '🦵', '🏋️', '🏃', '⚡']
      const descriptions = [
        'Treino de empurrão focado em peito, ombros e tríceps',
        'Treino de puxada focado em costas e bíceps',
        'Treino de pernas completo com foco em quadríceps e posteriores',
        'Treino de superiores - peito, costas e ombros',
        'Treino de inferiores - pernas e glúteos completo',
        'Treino de corpo inteiro para iniciantes'
      ]

      console.log(`  {`)
      console.log(`    id: '${template.id}',`)
      console.log(`    nome: '${template.nome}',`)
      console.log(`    descricao: '${descriptions[index]}',`)
      console.log(`    categoria: '${categoria}',`)
      console.log(`    icon: '${icons[index]}'`)
      console.log(`  },`)
    })
    console.log(']\n')

    console.log('🎉 Done! Copy the IDs above and paste into workout-templates.ts')

  } catch (error) {
    console.error('❌ Error seeding templates:', error)
    process.exit(1)
  }

  process.exit(0)
}

// Run the seeding function
seedTemplates()
