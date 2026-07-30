import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import profileData from "@/data/profile.json"
import { NowPlaying } from "@/components/now-playing"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-24">
        {/* Header */}
        <header className="mb-16">
          <h1 className="mb-1 text-xl font-normal">{profileData.header.name}</h1>
          <p className="mb-1 text-sm text-neutral-400">{profileData.header.handle}</p>
          <a
            href={profileData.header.profileUrl.href}
            className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white hover:underline underline-offset-4 transition-all"
          >
            {profileData.header.profileUrl.text}
            <ArrowUpRight className="h-3 w-3" />
          </a>
          <div className="mt-4">
            <iframe
              src="https://github.com/sponsors/mayowaoladosu/button"
              title="Sponsor mayowaoladosu"
              height={32}
              width={114}
              style={{ border: 0, borderRadius: "6px" }}
            />
          </div>
        </header>

        {/* About Section */}
        <section className="mb-16">
          <h2 className="mb-4 text-sm font-normal">{profileData.about.title}</h2>
          <p className="text-sm text-neutral-400">{profileData.about.description}</p>
        </section>

        <NowPlaying />

        {/* Research Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-sm font-normal">{profileData.research.title}</h2>
          <div className="space-y-4">
            {profileData.research.items.map((item) => (
              <article
                key={item.url}
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 transition-colors hover:border-neutral-700"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-500">
                  <span>{item.type}</span>
                  <span aria-hidden="true">/</span>
                  <span>{item.date}</span>
                </div>
                <h3 className="mt-4 max-w-2xl text-base leading-7 font-normal text-white">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
                  {item.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-neutral-800 pt-4 text-xs text-neutral-500">
                  {item.metrics.map((metric) => (
                    <span key={metric}>{metric}</span>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-4">
                  <Link
                    href={item.url}
                    className="inline-flex items-center gap-1 text-sm text-white transition-colors hover:text-neutral-300"
                  >
                    Read the study
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                  <a
                    href={item.doiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-white"
                  >
                    DOI record
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Experience Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-sm font-normal">{profileData.experience.title}</h2>
          <div className="grid grid-cols-[140px_1fr] gap-x-8 gap-y-6">
            {profileData.experience.items.map((item, index) => (
              <div key={index} className="contents">
                <div className="text-sm text-neutral-400">{item.period}</div>
                <div>
                  {item.url ? (
                    <a
                      href={item.url}
                      className="mb-2 inline-flex items-center gap-1 text-sm font-normal hover:underline underline-offset-4 transition-all"
                    >
                      {item.title}
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="mb-2 text-sm font-normal">{item.title}</p>
                  )}
                  <p className="text-sm leading-relaxed text-neutral-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-sm font-normal">{profileData.projects.title}</h2>
          <div className="grid grid-cols-[140px_1fr] gap-x-8 gap-y-6">
            {profileData.projects.items.map((item, index) => (
              <div key={index} className="contents">
                <div className="text-sm text-neutral-400">{item.status}</div>
                <div>
                  {item.url ? (
                    <a
                      href={item.url}
                      className="mb-2 inline-flex items-center gap-1 text-sm font-normal hover:underline underline-offset-4 transition-all"
                    >
                      {item.title}
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="mb-2 text-sm font-normal">{item.title}</p>
                  )}
                  <p className="text-sm leading-relaxed text-neutral-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <h2 className="mb-6 text-sm font-normal">{profileData.contact.title}</h2>
          <div className="grid grid-cols-[140px_1fr] gap-x-8 gap-y-4">
            {profileData.contact.items.map((item, index) => (
              <div key={index} className="contents">
                <div className="text-sm text-neutral-400">{item.label}</div>
                <a
                  href={item.url}
                  className="inline-flex items-center gap-1 text-sm hover:underline underline-offset-4 transition-all"
                >
                  {item.text}
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
