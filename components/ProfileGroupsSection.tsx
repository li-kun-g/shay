import Link from "next/link";

type GroupCard = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  description: string | null;
  role?: "PRESIDENT" | "ADMIN" | "MEMBER" | "FOLLOWING";
};

function roleBadge(role?: GroupCard["role"]) {
  if (!role) return null;

  const label =
    role === "PRESIDENT"
      ? "President"
      : role === "ADMIN"
      ? "Admin"
      : role === "MEMBER"
      ? "Member"
      : "Following";

  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
      {label}
    </span>
  );
}

export default function ProfileGroupsSection(props: {
  items: GroupCard[];
  isOwnProfile?: boolean;
}) {
  const { items, isOwnProfile } = props;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">
          {isOwnProfile ? "Your groups" : "Groups"}
        </h2>
        <p className="text-sm text-gray-500">
          {items.length} {items.length === 1 ? "group" : "groups"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          {isOwnProfile ? "You are not in any groups yet." : "No groups to show yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((g) => (
            <Link
              key={`${g.id}-${g.role ?? "group"}`}
              href={`/g/${g.slug}`}
              className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 transition hover:bg-gray-50"
            >
              <span className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-gray-100 ring-1 ring-black/10 flex items-center justify-center">
                {g.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.image}
                    alt={g.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg">👥</span>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium truncate">{g.name}</span>
                  {roleBadge(g.role)}
                </div>
                <div className="text-sm text-gray-500 truncate">@{g.slug}</div>
                {g.description && (
                  <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {g.description}
                  </div>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}