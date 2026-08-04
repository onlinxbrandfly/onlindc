import { supabase } from "../../services/supabase";

export const VAPID_PUBLIC_KEY = "BCIP8jNvuEVS6qwY_r78IYrk2CnCYtBSAkz2uti36PZ6ecSgsf5j1REopGQn5lLUJKMPF5_FcGcKrqy7xMso30M";

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function keyToBase64(key) {
  return window.btoa(String.fromCharCode(...new Uint8Array(key)));
}

export function supportsPush() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function subscribeToPush() {
  if (!supportsPush()) throw new Error("Push notifications are not supported on this device.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please log in again before enabling notifications.");
  const key = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");
  const payload = {
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: keyToBase64(key),
    auth_key: keyToBase64(auth),
    device_name: /iPhone|iPad/i.test(navigator.userAgent) ? "iPhone / iPad" : /Android/i.test(navigator.userAgent) ? "Android" : "Browser",
    user_agent: navigator.userAgent,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from("push_subscriptions").upsert(payload, { onConflict: "endpoint" });
  if (error) throw error;
  return subscription;
}

export async function unsubscribeFromPush() {
  if (!supportsPush()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
}

export async function hasPushSubscription() {
  if (!supportsPush()) return false;
  const registration = await navigator.serviceWorker.ready;
  return Boolean(await registration.pushManager.getSubscription());
}

export async function loadNotifications() {
  const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(40);
  if (error) throw error;
  return data || [];
}

export async function markNotificationsRead(ids) {
  if (!ids.length) return;
  const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", ids);
  if (error) throw error;
}

export async function loadNotificationPreferences() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  if (data) return data;
  const { data: created, error: createError } = await supabase.from("notification_preferences").insert({ user_id: user.id }).select("*").single();
  if (createError) throw createError;
  return created;
}

export async function saveNotificationPreferences(userId, values) {
  const { data, error } = await supabase.from("notification_preferences").upsert({ user_id: userId, ...values, updated_at: new Date().toISOString() }).select("*").single();
  if (error) throw error;
  return data;
}

export async function notificationChannel(onNotification) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return supabase.channel(`admin-notifications-${user.id}`).on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
    ({ new: notification }) => onNotification(notification)
  ).subscribe();
}
