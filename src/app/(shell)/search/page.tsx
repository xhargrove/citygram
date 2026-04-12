import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let cities: { id: string; name: string; slug: string; region: string | null }[] = [];
  let profiles: { username: string; display_name: string; avatar_url: string | null }[] = [];
  let posts: { id: string; caption: string | null }[] = [];

  if (query.length >= 2) {
    const tag = query.startsWith("#") ? query.slice(1).toLowerCase() : query.replace("#", "").toLowerCase();

    const [{ data: c }, { data: p }, { data: po }] = await Promise.all([
      supabase.from("cities").select("id, name, slug, region").ilike("name", `%${query}%`).limit(8),
      supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .ilike("username_lower", `%${query.toLowerCase()}%`)
        .limit(8),
      supabase
        .from("posts")
        .select("id, caption")
        .contains("hashtags", [tag])
        .eq("is_removed", false)
        .limit(8),
    ]);

    cities = c ?? [];
    profiles = p ?? [];
    posts = po ?? [];
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-24 pt-6 safe-pt">
      <header className="mb-6 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Search</p>
        <h1 className="font-display text-3xl font-semibold">Find a thread</h1>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="City, creator, #hashtag"
            className="min-h-12 flex-1 rounded-2xl border border-border bg-card px-4 text-sm"
          />
          <button
            type="submit"
            className="min-h-12 rounded-2xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
          >
            Go
          </button>
        </form>
      </header>

      {query.length < 2 && (
        <p className="text-sm text-muted">Type at least two characters to search cities, people, or tags.</p>
      )}

      {query.length >= 2 && (
        <div className="space-y-8">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Cities</h2>
            <ul className="mt-3 space-y-2">
              {cities.length === 0 && <li className="text-sm text-muted">No city matches.</li>}
              {cities.map((city) => (
                <li key={city.id}>
                  <Link href={`/city/${city.slug}`} className="text-sm font-semibold text-accent">
                    {city.name}
                    <span className="text-muted"> · {city.region}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">People</h2>
            <ul className="mt-3 space-y-2">
              {profiles.length === 0 && <li className="text-sm text-muted">No people matches.</li>}
              {profiles.map((p) => (
                <li key={p.username}>
                  <Link href={`/u/${p.username}`} className="text-sm font-semibold">
                    @{p.username}
                    <span className="text-muted"> · {p.display_name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Hashtags</h2>
            <ul className="mt-3 space-y-2">
              {posts.length === 0 && <li className="text-sm text-muted">No posts with that tag yet.</li>}
              {posts.map((post) => (
                <li key={post.id}>
                  <Link href={`/post/${post.id}`} className="text-sm">
                    {post.caption?.slice(0, 120) ?? "View post"}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
