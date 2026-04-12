import { redirect } from "next/navigation";

type Props = { params: Promise<{ username: string }> };

export default async function BusinessProfileRoute({ params }: Props) {
  const { username } = await params;
  redirect(`/u/${username}`);
}
