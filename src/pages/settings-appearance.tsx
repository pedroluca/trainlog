import { Check, Crown, Monitor, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { PremiumUpgrade } from '../components/premium-upgrade'
import { Card } from '../components/ui/card'
import { SegmentedControl } from '../components/ui/misc'
import { Page, SectionTitle, StackHeader } from '../components/ui/page'
import { useCurrentUser } from '../contexts/current-user-context'
import { PRIMARY_COLORS, useTheme } from '../contexts/theme-context'
import { cn } from '../utils/cn'

type ThemeMode = 'light' | 'dark' | 'system'

export function SettingsAppearance() {
  const profile = useCurrentUser()
  const { themeMode, setThemeMode, primaryColor, setPrimaryColor } = useTheme()
  const [premiumOpen, setPremiumOpen] = useState(false)
  const isPremium = !!profile?.isPremium

  return (
    <>
      <StackHeader title="Aparência" backTo="/profile/settings" />
      <Page className="gap-6 pt-2">
        <section className="flex flex-col gap-2">
          <SectionTitle title="Tema" />
          <SegmentedControl<ThemeMode>
            value={themeMode}
            onChange={setThemeMode}
            options={[
              { value: 'light', label: 'Claro', icon: Sun },
              { value: 'dark', label: 'Escuro', icon: Moon },
              { value: 'system', label: 'Sistema', icon: Monitor },
            ]}
          />
          <p className="px-1 text-xs text-subtle">“Sistema” acompanha o modo escuro do seu dispositivo.</p>
        </section>

        <section className="flex flex-col gap-2">
          <SectionTitle title="Cor principal" action={!isPremium ? <Crown size={14} className="text-premium" aria-label="Premium" /> : undefined} />
          <Card className="flex flex-col gap-4 p-4">
            <div role="radiogroup" aria-label="Cor principal" className="flex flex-wrap justify-between gap-3">
              {PRIMARY_COLORS.map(color => {
                const selected = color.hex.toLowerCase() === primaryColor.toLowerCase()
                const locked = !isPremium && color !== PRIMARY_COLORS[0]
                return (
                  <button
                    key={color.hex}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${color.name}${locked ? ', exclusivo Premium' : ''}`}
                    title={locked ? `${color.name} (Premium)` : color.name}
                    onClick={() => (locked ? setPremiumOpen(true) : setPrimaryColor(color.hex))}
                    className="group flex flex-col items-center gap-1.5 rounded-xl p-1 focus-ring"
                  >
                    <span
                      className={cn('flex size-11 items-center justify-center rounded-full transition-transform group-hover:scale-105', locked && 'opacity-35')}
                      style={{ backgroundColor: color.hex }}
                    >
                      {selected && <Check size={20} color="#ffffff" strokeWidth={3} aria-hidden />}
                    </span>
                    <span className={cn('text-xs', selected ? 'text-foreground' : 'text-muted')}>{color.name}</span>
                  </button>
                )
              })}
            </div>
            {!isPremium && (
              <button type="button" onClick={() => setPremiumOpen(true)} className="text-center text-sm hover:underline">
                <span className="font-semibold text-premium">Premium</span>
                <span className="text-muted"> libera todas as cores</span>
              </button>
            )}
          </Card>
        </section>
      </Page>
      <PremiumUpgrade open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  )
}
