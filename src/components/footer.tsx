export function Footer() {
  return (
    <footer className='h-28 bg-gray-800 text-white flex flex-col items-center justify-center'>
      <main className='h-[70%] w-full flex flex-col items-center justify-center border-b-1 border-gray-600'>
        <img src="/logo.png" alt="Logo" className="w-16 h-16" />
        <h1 className='text-3xl font-bold'>TrainLog</h1>
      </main>
      <section className='h-[30%] w-full flex items-center justify-center'>
        <p>© 2023 TrainLog. All rights reserved.</p>
      </section>
    </footer>
  )
}