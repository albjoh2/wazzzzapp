import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { FC } from "react";
import FriendRequests from "@/components/FriendRequest";

const page = async () => {
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  const incommingSenderIds = (await fetchRedis(
    "smembers",
    `user:${session.user.id}:incomming_friend_requests`
  )) as string[];

  const incommingFriendRequests = await Promise.all(
    incommingSenderIds.map(async (senderId) => {
      const sender = (await fetchRedis("get", `user:${senderId}`)) as string;
      const senderParsed = JSON.parse(sender) as User;
      return {
        senderId,
        senderEmail: senderParsed.email,
      };
    })
  );

  return (
    <main className="pt-8">
      <h1 className="font-bold text-5xl mb-8">Add a friend</h1>
      <div className="flex flex-col gap-4">
        <FriendRequests
          incomingFriendRequests={incommingFriendRequests}
          sessionId={session.user.id}
        />
      </div>
    </main>
  );
};

export default page;
