import React, { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, CheckCheck, Download, RefreshCw, Settings2, Smartphone, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { supabase } from "../../services/supabase";
import {
  hasPushSubscription, loadNotificationPreferences, loadNotifications,
  markNotificationsRead, notificationChannel, saveNotificationPreferences,
  subscribeToPush, supportsPush, unsubscribeFromPush
} from "../services/notificationService";

function isIos() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }

export default function AdminAppTools({ notify }) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);
  const [busy, setBusy] = useState(false);
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    immediate: true,
    onOfflineReady() { notify("OnlinDC is ready to open offline."); },
    onRegisterError(error) { console.error("PWA registration failed", error); }
  });

  useEffect(() => {
    const captureInstall = (event) => { event.preventDefault(); setInstallEvent(event); };
    const installed = () => { setInstallEvent(null); notify("OnlinDC installed."); };
    window.addEventListener("beforeinstallprompt", captureInstall);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", captureInstall); window.removeEventListener("appinstalled", installed); };
  }, [notify]);

  useEffect(() => {
    let channel;
    Promise.all([loadNotifications(), loadNotificationPreferences(), hasPushSubscription()]).then(([items, prefs, enabled]) => {
      setNotifications(items); setPreferences(prefs); setPushEnabled(enabled);
    }).catch((error) => console.error("Notification setup failed", error));
    notificationChannel((item) => setNotifications((current) => [item, ...current])).then((value) => { channel = value; });
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const unread = useMemo(() => notifications.filter((item) => !item.is_read), [notifications]);

  async function enablePush() {
    setBusy(true);
    try { await subscribeToPush(); setPushEnabled(true); notify("Notifications enabled on this device."); }
    catch (error) { notify(error.message || "Could not enable notifications."); }
    finally { setBusy(false); }
  }

  async function disablePush() {
    setBusy(true);
    try { await unsubscribeFromPush(); setPushEnabled(false); notify("Notifications disabled on this device."); }
    catch (error) { notify(error.message || "Could not disable notifications."); }
    finally { setBusy(false); }
  }

  async function markAllRead() {
    await markNotificationsRead(unread.map((item) => item.id));
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    if ("clearAppBadge" in navigator) navigator.clearAppBadge();
  }

  async function togglePreference(key) {
    if (!preferences) return;
    const next = await saveNotificationPreferences(preferences.user_id, { [key]: !preferences[key] });
    setPreferences(next);
  }

  async function installApp() {
    if (!installEvent) return;
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") setInstallEvent(null);
  }

  return <>
    <button className="notificationDock" type="button" aria-label="Notifications" onClick={() => setOpen(true)}><Bell size={21}/>{unread.length > 0 && <span>{unread.length > 99 ? "99+" : unread.length}</span>}</button>
    {needRefresh && <div className="pwaUpdateBar"><span>A new OnlinDC version is ready.</span><button onClick={() => updateServiceWorker(true)}><RefreshCw size={17}/>Update</button><button aria-label="Dismiss update" onClick={() => setNeedRefresh(false)}><X size={17}/></button></div>}
    {open && <div className="appSheetBackdrop" onClick={() => setOpen(false)}><section className="appSheet notificationSheet" onClick={(event) => event.stopPropagation()}><div className="appSheetHandle"/><header><div><h2>Notifications</h2><p>{unread.length ? `${unread.length} unread` : "You are all caught up"}</p></div><button aria-label="Close notifications" onClick={() => setOpen(false)}><X size={22}/></button></header>
      <div className="notificationQuickActions">
        {!isStandalone() && installEvent && <button onClick={installApp}><Download size={19}/><span><b>Install OnlinDC</b><small>Add it to this device</small></span></button>}
        {!isStandalone() && isIos() && !installEvent && <div className="iosInstallTip"><Smartphone size={20}/><span><b>Install on iPhone</b><small>Safari Share menu → Add to Home Screen</small></span></div>}
        {supportsPush() && (pushEnabled ? <button onClick={disablePush} disabled={busy}><BellOff size={19}/><span><b>Disable push</b><small>This device is subscribed</small></span></button> : <button onClick={enablePush} disabled={busy}><Bell size={19}/><span><b>Enable push</b><small>Important alerts and daily summary</small></span></button>)}
        <button onClick={() => setSettingsOpen(!settingsOpen)}><Settings2 size={19}/><span><b>Preferences</b><small>Choose what reaches you</small></span></button>
      </div>
      {settingsOpen && preferences && <div className="notificationPreferences">
        {[['important_leads','Important and new leads'],['daily_summary','Daily follow-up summary'],['demo_updates','Demo updates'],['won_updates','Won opportunities']].map(([key,label]) => <label key={key}><span>{label}</span><input type="checkbox" checked={Boolean(preferences[key])} onChange={() => togglePreference(key)}/></label>)}
      </div>}
      <div className="notificationListHead"><b>Recent</b>{unread.length > 0 && <button onClick={markAllRead}><CheckCheck size={17}/>Mark all read</button>}</div>
      <div className="notificationList">{notifications.map((item) => <button className={item.is_read ? "" : "unread"} key={item.id} onClick={async () => { if (!item.is_read) { await markNotificationsRead([item.id]); setNotifications((current) => current.map((row) => row.id === item.id ? { ...row, is_read: true } : row)); } window.location.assign(item.url || "/admin"); }}><span/><div><b>{item.title}</b><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString()}</small></div></button>)}{!notifications.length && <div className="emptyState">Notifications will appear here.</div>}</div>
    </section></div>}
  </>;
}
