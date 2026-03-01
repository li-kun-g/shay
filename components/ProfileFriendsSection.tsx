import Link from "next/link";

type FriendCard = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  emoji: string | null;
};

export default function ProfileFriendsSection(props: {
  items: FriendCard[];
  isOwnProfile?: boolean;
}) {
  const { items, isOwnProfile } = props;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">
          {isOwnProfile ? "Your friends" : "Friends"}
        </h2>
        <p className="text-sm text-gray-500">
          {items.length} {items.length === 1 ? "friend" : "friends"}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          {isOwnProfile ? "You have no friends yet." : "No friends to show yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((u) => (
            <Link
              key={u.id}
              href={`/u/${u.username}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 transition hover:bg-gray-50"
            >
              <span className="h-12 w-12 shrink-0 rounded-full overflow-hidden bg-gray-100 ring-1 ring-black/10 flex items-center justify-center">
                {u.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.image}
                    alt={u.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg">{u.emoji ?? "☕"}</span>
                )}
              </span>

              <span className="min-w-0">
                <div className="font-medium truncate">@{u.username}</div>
                {u.name && <div className="text-sm text-gray-500 truncate">{u.name}</div>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}