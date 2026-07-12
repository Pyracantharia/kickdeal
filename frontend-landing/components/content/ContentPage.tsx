import AppFooter from '@/components/AppFooter'
import AppHeader from '@/components/AppHeader'

type ContentSection = {
  title: string
  body: string[]
}

type ContentPageProps = {
  eyebrow: string
  title: string
  description: string
  updatedAt?: string
  sections: ContentSection[]
}

function ContentPage({
  eyebrow,
  title,
  description,
  updatedAt,
  sections,
}: ContentPageProps) {
  return (
    <>
      <AppHeader />
      <main className="pt-28 sm:pt-32">
        <section className="px-4 pb-16 sm:pb-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 border-b border-white/10 pb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-cyan">
                {eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-bold uppercase leading-tight tracking-wider text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                {description}
              </p>
              {updatedAt ? (
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-white/45">
                  Derniere mise a jour : {updatedAt}
                </p>
              ) : null}
            </div>

            <div className="space-y-5">
              {sections.map((section) => (
                <section
                  key={section.title}
                  className="rounded-lg border border-white/10 bg-dark-900/70 p-6 backdrop-blur-sm sm:p-8"
                >
                  <h2 className="text-xl font-bold uppercase tracking-wider text-white">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/70 sm:text-base">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  )
}

export default ContentPage
