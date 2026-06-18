"use client";

import { useState } from "react";
import { appConfig } from "@/lib/app-config";

type SendStatus = {
  type: "idle" | "success" | "error";
  message: string;
};

type SendResult = {
  error?: string;
  recipients?: number;
  targetCount?: number;
};

export function AdminPushForm() {
  const [status, setStatus] = useState<SendStatus>({
    type: "idle",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);

  async function sendPush(formData: FormData, targetType: "test" | "all") {
    const title = String(formData.get("title") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const targetUrl = String(formData.get("targetUrl") || "").trim();

    if (!title || !message) {
      setStatus({
        type: "error",
        message: "Preencha titulo e mensagem antes de enviar.",
      });
      return;
    }

    setIsSending(true);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          targetUrl,
          targetType,
        }),
      });

      const result = (await response.json().catch(() => null)) as SendResult | null;
      const recipientCount = result?.recipients || result?.targetCount || 0;

      setStatus({
        type: response.ok ? "success" : "error",
        message:
          result?.error ||
          (response.ok
            ? `Push enviado para ${recipientCount} inscrito(s).`
            : "Falha ao enviar push."),
      });
    } catch {
      setStatus({
        type: "error",
        message: "Nao foi possivel conectar com a API de envio.",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Titulo
        <input
          className="min-h-12 rounded-lg border border-slate-200 bg-white px-3 text-base font-normal text-slate-950 outline-none focus:border-slate-400"
          disabled={isSending}
          name="title"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Mensagem
        <textarea
          className="min-h-28 rounded-lg border border-slate-200 bg-white px-3 py-3 text-base font-normal text-slate-950 outline-none focus:border-slate-400"
          disabled={isSending}
          name="message"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        URL de destino
        <input
          className="min-h-12 rounded-lg border border-slate-200 bg-white px-3 text-base font-normal text-slate-950 outline-none focus:border-slate-400"
          defaultValue={appConfig.platformUrl === "#" ? "" : appConfig.platformUrl}
          disabled={isSending}
          name="targetUrl"
          type="url"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSending}
          formAction={(formData) => void sendPush(formData, "test")}
          type="submit"
        >
          {isSending ? "Enviando..." : "Enviar teste"}
        </button>
        <button
          className="min-h-12 rounded-lg px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSending}
          formAction={(formData) => void sendPush(formData, "all")}
          style={{ backgroundColor: appConfig.themeColor }}
          type="submit"
        >
          {isSending ? "Enviando..." : "Enviar para todos"}
        </button>
      </div>

      {status.message ? (
        <p
          className={
            status.type === "success"
              ? "rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
              : "rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
          }
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
