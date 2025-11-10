'use client';

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notification-service";
import { Notification } from "@/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent<number>("notifications:updated", { detail: unreadCount }));
  }, [unreadCount]);
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchNotifications({ per_page: 50 });
      const entries = response.data ?? [];
      setNotifications(entries);
      const unread = response.meta.unread_count ?? entries.filter((item) => !item.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar as notificações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) {
      return;
    }

    try {
      setProcessingId(notification.id);
      const updated = await markNotificationAsRead(notification.id);
      const next = notifications.map((item) => (item.id === updated.id ? updated : item));
      setNotifications(next);
      setUnreadCount(next.filter((item) => !item.is_read).length);
    } catch (error) {
      handleApiError(error, "Não foi possível marcar como lida");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAll = async () => {
    try {
      setProcessingId(-1);
      await markAllNotificationsAsRead();
      await loadNotifications();
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error) {
      handleApiError(error, "Não foi possível marcar todas como lidas");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>
              Você possui {unreadCount} notificações não lidas.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => loadNotifications()} disabled={loading}>
              Atualizar
            </Button>
            <Button
              variant="secondary"
              onClick={handleMarkAll}
              disabled={processingId === -1 || unreadCount === 0}
            >
              Marcar todas como lidas
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>Mensagens importantes sobre sua agenda.</CardDescription>
        </CardHeader>
        <div className="max-h-[560px] overflow-y-auto border-t border-slate-200">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState className="m-6">Nenhuma notificação encontrada.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-200">
              {notifications.map((notification) => (
                <li key={notification.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{notification.subject}</p>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Enviada em{" "}
                        {new Date(notification.sent_at).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                        {notification.is_read && notification.read_at
                          ? ` • Lida em ${new Date(notification.read_at).toLocaleString("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          notification.is_read
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {notification.is_read ? "Lida" : "Não lida"}
                      </span>
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleMarkAsRead(notification)}
                          disabled={processingId === notification.id}
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}


