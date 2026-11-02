import { Injectable, Logger } from '@nestjs/common';

export interface AppNotification {
  id: string;
  userId?: string | null; // ID nhân viên nhận riêng (null nếu gửi chung)
  role?: string | null;   // 'STAFF', 'ADMIN', hoặc null
  title: string;
  message: string;
  type: 'NEW_BOOKING' | 'STAFF_ASSIGNED' | 'GENERAL';
  metadata?: Record<string, any>;
  createdAt: string;
  readByUserIds: string[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private notifications: AppNotification[] = [];

  constructor() {
    // Thông báo chào mừng ban đầu
    this.create({
      role: 'STAFF',
      title: 'Chào mừng ca làm việc',
      message: 'Hệ thống Quản lý Royal Billiards đã sẵn sàng tiếp nhận đặt bàn và phục vụ khách.',
      type: 'GENERAL',
    });
  }

  create(data: {
    userId?: string | null;
    role?: string | null;
    title: string;
    message: string;
    type: 'NEW_BOOKING' | 'STAFF_ASSIGNED' | 'GENERAL';
    metadata?: Record<string, any>;
  }): AppNotification {
    const id = `notif-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newNotif: AppNotification = {
      id,
      userId: data.userId || null,
      role: data.role || null,
      title: data.title,
      message: data.message,
      type: data.type,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
      readByUserIds: [],
    };

    // Giữ tối đa 200 thông báo gần nhất trong bộ nhớ
    this.notifications.unshift(newNotif);
    if (this.notifications.length > 200) {
      this.notifications.pop();
    }

    this.logger.log(`[Notification Created] [${data.type}] ${data.title} -> ${data.userId || data.role || 'ALL'}`);
    return newNotif;
  }

  findForUser(userId: string, role: string) {
    return this.notifications
      .filter((n) => {
        // 1. Gửi đích danh cho user này
        if (n.userId && n.userId === userId) return true;
        // 2. Gửi cho vai trò này (ví dụ STAFF hoặc ADMIN)
        if (n.role && (n.role === role || (role === 'ADMIN' && n.role === 'STAFF'))) return true;
        // 3. Gửi broadcast chung
        if (!n.userId && !n.role) return true;
        return false;
      })
      .map((n) => ({
        ...n,
        isRead: n.readByUserIds.includes(userId),
      }));
  }

  markRead(notificationId: string, userId: string) {
    const notif = this.notifications.find((n) => n.id === notificationId);
    if (notif && !notif.readByUserIds.includes(userId)) {
      notif.readByUserIds.push(userId);
    }
    return { success: true };
  }

  markAllRead(userId: string, role: string) {
    const userNotifs = this.findForUser(userId, role);
    for (const n of userNotifs) {
      const orig = this.notifications.find((item) => item.id === n.id);
      if (orig && !orig.readByUserIds.includes(userId)) {
        orig.readByUserIds.push(userId);
      }
    }
    return { success: true };
  }
}
