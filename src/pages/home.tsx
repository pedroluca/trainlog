import { Link } from 'react-router-dom'

export function Home() {
  const usuarioID = localStorage.getItem('usuarioId')
  const isLogged = usuarioID ? true : false
  
  return (
    <main className={`${isLogged ? ' pb-24' : ''} flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] bg-gray-100 p-6`}>
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">TrainLog</h1>
        <p className="text-gray-700 text-lg mb-6">
          Bem-vindo ao TrainLog, o aplicativo simples e eficiente para acompanhar seus treinos e progresso!
        </p>
        <div className="space-y-4">
          <p className="text-gray-600">
            Com o TrainLog, você pode:
          </p>
          <ul className="list-disc list-inside text-left text-gray-600">
            <li>Registrar seus treinos diários</li>
            <li>Acompanhar os exercícios realizados</li>
            <li>Cronometrar os intervalos de descanso no próprio app</li>
          </ul>
        </div>
        <div className="mt-8 space-y-4">
          <Link
            to="/login"
            className="block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="block bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded"
          >
            Criar Conta
          </Link>
        </div>
      </div>
    </main>
  )
}