import { getVersionWithPrefix } from '../version'

type FooterProps = {
  showInformation?: boolean
}

export function Footer({ showInformation = true }: FooterProps) {
  return (
    <footer className="mt-6 text-center space-y-2 pb-8 md:pb-30 lg:pb-0">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} TrainLog. Todos os direitos reservados.
      </p>
      {
        showInformation && (
          <>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Desenvolvido por{' '}
              <a 
                href='https://pedroluca.dev.br' 
                target='_blank' 
                rel='noopener noreferrer' 
                className='text-primary hover:text-[#219150] font-medium transition-colors'
              >
                Pedro Luca Prates
              </a>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer underline">
              {getVersionWithPrefix()}
            </p>
          </>
        )
      }
    </footer>
  )
}