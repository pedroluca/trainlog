/**
 * AdminEmailSeed — One-time migration utility
 *
 * Seeds the `emailsRegistrados` Firestore collection from the existing
 * `usuarios` collection. Only needed if the emailsRegistrados collection
 * is missing or out of sync (e.g. after a data migration).
 *
 * Usage: uncomment the <AdminEmailSeed /> render in admin/users.tsx header.
 */

// import { useState } from 'react'
// import { DatabaseZap } from 'lucide-react'
// import { db } from '../../firebaseConfig'
// import { doc, setDoc } from 'firebase/firestore'
// import { type UserData } from '../../layouts/admin-layout'
//
// export function AdminEmailSeed({ users }: { users: UserData[] }) {
//   const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
//
//   const handleSeed = async () => {
//     if (status === 'loading') return
//     const ok = window.confirm(`Indexar ${users.length} email(s) em emailsRegistrados. Continuar?`)
//     if (!ok) return
//
//     setStatus('loading')
//     try {
//       const CHUNK = 400
//       for (let i = 0; i < users.length; i += CHUNK) {
//         await Promise.all(
//           users
//             .slice(i, i + CHUNK)
//             .filter(u => u.email)
//             .map(u =>
//               setDoc(
//                 doc(db, 'emailsRegistrados', u.email.trim().toLowerCase()),
//                 { uid: u.id, criadoEm: u.criadoEm || new Date().toISOString() },
//                 { merge: true }
//               )
//             )
//         )
//       }
//       setStatus('done')
//     } catch (err) {
//       console.error('Erro ao indexar emails:', err)
//       setStatus('error')
//     }
//   }
//
//   return (
//     <button
//       onClick={handleSeed}
//       disabled={status === 'loading'}
//       className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border
//         ${status === 'done'  ? 'bg-green-500/10 text-green-400 border-green-500/30'
//         : status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30'
//         : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'}
//         disabled:opacity-60 disabled:cursor-not-allowed`}
//     >
//       {status === 'loading' ? (
//         <><span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> Indexando...</>
//       ) : status === 'done' ? '✓ Emails indexados'
//         : status === 'error' ? '✗ Erro ao indexar'
//         : <><DatabaseZap size={16} /> Indexar Emails</>}
//     </button>
//   )
// }

export {} // keep this file as a module
