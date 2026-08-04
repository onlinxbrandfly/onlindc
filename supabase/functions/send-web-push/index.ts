import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:admin@onlin.in",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

const preferenceMap: Record<string, string> = {
  important_lead: "important_leads",
  new_diagnostic: "important_leads",
  daily_summary: "daily_summary",
  demo_scheduled: "demo_updates",
  lead_won: "won_updates"
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const payload = await request.json();
  const notification = payload.record || payload;
  if (!notification?.id || !notification?.user_id) {
    return Response.json({ error: "Missing notification record" }, { status: 400 });
  }

  const preferenceField = preferenceMap[notification.notification_type];
  if (preferenceField) {
    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", notification.user_id)
      .maybeSingle();
    if (preferences && preferences[preferenceField] === false) {
      return Response.json({ skipped: "disabled_by_user" });
    }
  }

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("user_id", notification.user_id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const message = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url || "/admin",
    tag: notification.notification_type,
    notificationId: notification.id
  });

  let sent = 0;
  for (const subscription of subscriptions || []) {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth_key }
      }, message);
      sent += 1;
    } catch (pushError) {
      const deliveryError = pushError as { statusCode?: number; status?: number };
      const statusCode = deliveryError.statusCode || deliveryError.status;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
      } else {
        console.error("Push delivery failed", pushError);
      }
    }
  }

  if (sent > 0) {
    await supabase.from("notifications").update({ pushed_at: new Date().toISOString() }).eq("id", notification.id);
  }
  return Response.json({ sent });
});
