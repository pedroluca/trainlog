import Logo from '../assets/full-logo.png'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='h-40 mb-16 bg-[#1A252F] text-white flex flex-col items-center justify-center'>
      <main className='h-[60%] w-full flex flex-col items-center justify-center'>
        <img src={Logo} alt='Logo' className='w-32 h-16' />
      </main>
      <section className='h-[40%] w-full flex flex-col items-center justify-center'>
        <p>© {currentYear} TrainLog. All rights reserved.</p>
        <p className='text-sm text-[#BDC3C7] mb-2'>
          Desenvolvido por <a href='https://pedroluca.tech' target='_blank' rel='noopener noreferrer' className='text-[#F1C40F] hover:underline'>Pedro Luca Prates</a>.
        </p>
      </section>
    </footer>
  )
}