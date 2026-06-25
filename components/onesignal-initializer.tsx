"use client";

import { useEffect } from "react";
import { initializeOneSignal } from "@/lib/onesignal/client";

export function OneSignalInitializer() {
  useEffect(() => {
    initializeOneSignal();
  }, []);

  return null;
}
