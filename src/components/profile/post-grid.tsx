import Image from "next/image";
import Link from "next/link";
import { storagePublicUrl } from "@/lib/media";
import type { PostThumb } from "@/lib/data/profile";

type Props = {
  items: PostThumb[];
};

export function PostGrid({ items }: Props) {
  if (!items.length) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted">
        Nothing here yet — share a slice of your city.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-px bg-border">
      {items.map((item) => (
        <Link
          key={item.postId}
          href={`/post/${item.postId}`}
          className="relative aspect-square overflow-hidden bg-card"
        >
          {item.storage_path && item.media_type === "image" ? (
            <Image
              src={storagePublicUrl(item.storage_path)}
              alt=""
              fill
              className="object-cover"
              sizes="33vw"
            />
          ) : item.storage_path && item.media_type === "video" ? (
            <video
              src={storagePublicUrl(item.storage_path)}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-foreground/5 text-xs text-muted">
              Post
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
