import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email: emailToAdd } = addFriendValidator.parse(body.email);

    const idToAdd = (await fetchRedis(
      "get",
      `user:email:${emailToAdd}`
    )) as string;

    if (!idToAdd) {
      return new Response("User not found", {
        status: 400,
      });
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    if (idToAdd === session.user.id) {
      return new Response("You can't add yourself as a friend", {
        status: 400,
      });
    }

    const isAlreadyAdded = (await fetchRedis(
      "sismember",
      `user:${idToAdd}:incoming_friend_request`,
      session.user.id
    )) as 1 | 0;

    if (isAlreadyAdded) {
      return new Response("You already sent a friend request to this user", {
        status: 400,
      });
    }

    const isAlreadyFriends = (await fetchRedis(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    )) as 1 | 0;

    if (isAlreadyFriends) {
      return new Response("You are already friends with this user", {
        status: 400,
      });
    }

    db.sadd(`user:${idToAdd}:incoming_friend_request`, session.user.id);

    return new Response("Friend request sent", {
      status: 200,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid request payload", {
        status: 400,
      });
    }

    return new Response("invalid request", {
      status: 400,
    });
  }
}
