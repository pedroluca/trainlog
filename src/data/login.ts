import { auth } from '../firebaseConfig'
import { signInWithEmailAndPassword } from 'firebase/auth'

export async function login(email: string, password: string, navigate: (path: string) => void) {  
  try {
    await signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user
        const uid = user.uid
        localStorage.setItem('usuarioId', uid)
        navigate('/')
      })
  } catch (error) {
    console.error('Erro no login:', error)
  }
}