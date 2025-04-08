import Logo from '../assets/full-logo.png'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="h-40 mb-16 bg-gray-500 text-white flex flex-col items-center justify-center">
      <main className="h-[60%] w-full flex flex-col items-center justify-center border-b-1 border-gray-400">
        <img src={Logo} alt="Logo" className="w-32 h-16" />
      </main>
      <section className="h-[40%] w-full flex flex-col items-center justify-center">
        <p>© {currentYear} TrainLog. All rights reserved.</p>
        <p className="text-sm text-gray-400 mb-2">
          Desenvolvido por <a href="https://pedroluca.tech" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Pedro Luca Prates</a>.
        </p>
      </section>
    </footer>
  )
}