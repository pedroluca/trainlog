import { doc, setDoc } from 'firebase/firestore'
import { ChevronRight, CloudDownload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { SectionTitle } from '../../components/ui/page'
import { Sheet } from '../../components/ui/sheet'
import { currentRelease, type WhatsNewItem } from '../../data/whats-new'
import { db } from '../../firebaseConfig'
import { contentIcon } from './content-icons'

type Props = {
  isOpen: boolean
  onClose: () => void
  /** Versão publicada mais nova que a carregada: obriga a recarregar o app */
  forceUpdateVersion?: string | null
  systemVersion?: string | null
}

/** Novidades da versão ou, se a versão carregada estiver velha, a atualização obrigatória */
export function ReleaseNotes({ isOpen, onClose, forceUpdateVersion, systemVersion }: Props) {
  const navigate = useNavigate()

  const markSeen = async () => {
    const version = systemVersion || currentRelease.version
    localStorage.setItem('lastSeenVersion', version)
    const usuarioID = localStorage.getItem('usuarioId')
    if (usuarioID) {
      await setDoc(doc(db, 'usuarios', usuarioID), { lastSeenVersion: version }, { merge: true })
        .catch(error => console.error('Erro ao salvar a versão vista:', error))
    }
  }

  const close = () => {
    markSeen()
    onClose()
  }

  const openItem = (item: WhatsNewItem) => {
    if (!item.action) return
    close()
    navigate(item.action.route)
  }

  if (forceUpdateVersion) return <ForceUpdateDialog version={forceUpdateVersion} />

  return (
    <Sheet open={isOpen} onClose={close} title={currentRelease.title} description={`Versão ${currentRelease.version}`} footer={<Button label="Entendi" fullWidth onClick={close} />}>
      <div className="flex flex-col gap-1 pb-2">
        {currentRelease.items.map(item => <ReleaseItem key={item.id} item={item} onOpen={openItem} />)}
        {!!currentRelease.previousItems?.length && (
          <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
            <SectionTitle title="Destaques anteriores" />
            {currentRelease.previousItems.map(item => <ReleaseItem key={item.id} item={item} onOpen={openItem} muted />)}
          </div>
        )}
      </div>
    </Sheet>
  )
}

function ReleaseItem({ item, onOpen, muted }: { item: WhatsNewItem; onOpen: (item: WhatsNewItem) => void; muted?: boolean }) {
  const Icon = contentIcon(item.id)
  const content = (
    <>
      <span className={muted ? 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted' : 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'}>
        <Icon size={20} aria-hidden />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-base font-semibold">{item.title}</span>
        <span className="text-sm leading-5 text-muted">{item.description}</span>
        {item.action && (
          <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary">
            {item.action.label}
            <ChevronRight size={16} aria-hidden />
          </span>
        )}
      </span>
    </>
  )

  if (item.action) {
    return (
      <button type="button" onClick={() => onOpen(item)} className="-mx-2 flex gap-3.5 rounded-xl p-2 text-left transition-colors hover:bg-surface-2 focus-ring">
        {content}
      </button>
    )
  }
  return <div className="flex gap-3.5 py-2">{content}</div>
}

/** Limpa o cache do PWA e recarrega para pegar a versão nova */
async function reloadWithFreshCache() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(registration => registration.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(key => caches.delete(key)))
    }
  } catch (error) {
    console.error('Erro ao limpar o cache do app:', error)
  }
  const url = new URL(window.location.href)
  url.searchParams.set('force-refresh', Date.now().toString())
  window.location.replace(url.toString())
}

function ForceUpdateDialog({ version }: { version: string }) {
  return (
    <Dialog open label="Atualização necessária">
      <div className="flex flex-col gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CloudDownload size={24} aria-hidden />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="type-heading">Atualização necessária</h2>
          <p className="text-sm leading-5 text-muted">
            A versão {version} do Tractus já está disponível. Atualize para carregar as novidades e continuar usando o app.
          </p>
        </div>
        <Button label="Atualizar agora" onClick={reloadWithFreshCache} autoFocus />
      </div>
    </Dialog>
  )
}
