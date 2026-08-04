import React, { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

export default function AdminToast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return <div className="adminToast" role="status"><CheckCircle2 size={20} /><span>{message}</span><button type="button" aria-label="Close notification" onClick={onClose}><X size={18} /></button></div>;
}
