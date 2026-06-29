import { NotificationType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { emitToUser } from "../sockets";

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

export const NotificationService = {
  async create(input: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type ?? "INFO",
        link: input.link,
      },
    });

    // Push in real time to any connected sockets for this user
    emitToUser(input.userId, "notification:new", notification);

    return notification;
  },

  async createMany(userIds: string[], data: Omit<CreateNotificationInput, "userId">) {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: data.title,
        message: data.message,
        type: data.type ?? "INFO",
        link: data.link,
      })),
    });
    userIds.forEach((userId) =>
      emitToUser(userId, "notification:new", { title: data.title, message: data.message, type: data.type })
    );
  },

  async listForUser(userId: string, params: { page: number; limit: number; skip: number; unreadOnly?: boolean }) {
    const where = { userId, ...(params.unreadOnly ? { isRead: false } : {}) };
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, total, unreadCount };
  },

  async markRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
