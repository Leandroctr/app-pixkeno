"use client";

export const appConfigClient = {
  oneSignalAppId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "",
  platformUrl: process.env.NEXT_PUBLIC_PLATFORM_URL || "",
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL || "#",
};
