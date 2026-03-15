import { ArrowUpRight } from "lucide-react"
import profileData from "@/data/profile.json"

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
        </header>

        {/* About Section */}
        <section className="mb-16">
          <h2 className="mb-4 text-sm font-normal">{profileData.about.title}</h2>
          <p className="text-sm text-neutral-400">{profileData.about.description}</p>
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
