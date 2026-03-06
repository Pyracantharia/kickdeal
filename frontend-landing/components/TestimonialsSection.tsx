import { Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote:
      "KickDeal a transformé notre façon de recruter. Nous avons finalisé 3 transferts en 2 semaines !",
    author: 'Jean-Marc Dubois',
    role: 'Directeur Sportif, RC Nantes',
    rating: 5,
  },
  {
    quote:
      "En tant qu'agent, je multiplie mes opportunités. La plateforme est incontournable pour finir ses transferts.",
    author: 'Scott Martinez',
    role: 'Agent FIFA Licencié',
    rating: 5,
  },
  {
    quote:
      "Interface intuitive, processus clair, gain de temps inestimable. KickDeal est l'outil qu'il nous manquait !",
    author: 'Thomas Leroy',
    role: 'Président, FC Strasbourg Academy',
    rating: 5,
  },
]

const AVATAR_COLORS = ['bg-cyan-600', 'bg-purple-600', 'bg-blue-600']

function TestimonialsSection() {
  return (
    <section className="section-dark py-20 sm:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wider text-white">
            Ils nous font confiance
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, author, role, rating }, i) => (
            <div key={author} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-brand-cyan text-brand-cyan"
                  />
                ))}
              </div>

              <blockquote className="text-sm text-white leading-relaxed flex-1">
                &ldquo;{quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
                <div className={`h-10 w-10 rounded-full ${AVATAR_COLORS[i]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {author.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{author}</p>
                  <p className="text-xs text-white/70">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection