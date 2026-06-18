"use client";

import { useEffect, useState } from "react";
import { initializeOneSignal } from "@/lib/onesignal/client";

export function OneSignalInitializer() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    initializeOneSignal().then((result) => {
      if (active && result.enabled && !result.subscribed) {
        setMessage(result.message);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!message) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-20 mx-auto max-w-sm rounded-lg bg-slate-950 px-4 py-3 text-sm text-white shadow-xl">
      {message}
    </div>
  );
}
