import { NextResponse } from "next/server";
import { appConfig } from "@/lib/app-config";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type SendPayload = {
  title?: string;
  message?: string;
  targetUrl?: string;
  targetType?: string;
};

function normalizePayload(payload: SendPayload) {
  return {
    title: payload.title?.trim() || "",
    message: payload.message?.trim() || "",
    targetUrl: payload.targetUrl?.trim() || appConfig.platformUrl,
    targetType: payload.targetType === "test" ? "test" : "all",
  };
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { ok: false, error: "Nao autenticado." },
      { status: 401 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const oneSignalRestApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!supabase || !appConfig.oneSignalAppId || !oneSignalRestApiKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase ou OneSignal nao configurado." },
      { status: 503 },
    );
  }

  let payload: SendPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload invalido." },
      { status: 400 },
    );
  }

  const data = normalizePayload(payload);

  if (!data.title || !data.message) {
    return NextResponse.json(
      { ok: false, error: "Titulo e mensagem sao obrigatorios." },
      { status: 400 },
    );
  }

  const limit = data.targetType === "test" ? 1 : 10000;
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("onesignal_id")
    .eq("permission_status", "granted")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (subscriptionsError) {
    return NextResponse.json(
      { ok: false, error: "Nao foi possivel buscar inscritos." },
      { status: 500 },
    );
  }

  const subscriptionIds =
    subscriptions?.map((item) => item.onesignal_id).filter(Boolean) || [];

  if (subscriptionIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Nenhum inscrito disponivel para envio." },
      { status: 400 },
    );
  }

  const oneSignalResponse = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: `Key ${oneSignalRestApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: appConfig.oneSignalAppId,
      include_subscription_ids: subscriptionIds,
      headings: { en: data.title, pt: data.title },
      contents: { en: data.message, pt: data.message },
      url: data.targetUrl,
    }),
  });

  const oneSignalResult = await oneSignalResponse.json().catch(() => ({}));
  const notificationId =
    typeof oneSignalResult.id === "string" ? oneSignalResult.id : null;

  const { error: campaignError } = await supabase.from("push_campaigns").insert({
    title: data.title,
    message: data.message,
    target_url: data.targetUrl,
    target_type: data.targetType,
    status: oneSignalResponse.ok ? "sent" : "failed",
    onesignal_notification_id: notificationId,
    recipient_count: subscriptionIds.length,
    error_message: oneSignalResponse.ok ? null : JSON.stringify(oneSignalResult),
    sent_at: oneSignalResponse.ok ? new Date().toISOString() : null,
  });

  if (!oneSignalResponse.ok) {
    return NextResponse.json(
      { ok: false, error: "OneSignal recusou o envio.", details: oneSignalResult },
      { status: 502 },
    );
  }

  if (campaignError) {
    return NextResponse.json(
      { ok: false, error: "Push enviado, mas campanha nao foi registrada." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    notificationId,
    recipients: subscriptionIds.length,
  });
}
