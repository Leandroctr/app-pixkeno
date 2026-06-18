import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type SubscribePayload = {
  onesignalId?: string;
  permissionStatus?: string;
  userAgent?: string;
  deviceType?: string;
};

export async function POST(request: Request) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase nao configurado." },
      { status: 503 },
    );
  }

  let payload: SubscribePayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload invalido." },
      { status: 400 },
    );
  }

  if (!payload.onesignalId) {
    return NextResponse.json(
      { ok: false, error: "onesignalId e obrigatorio." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      onesignal_id: payload.onesignalId,
      permission_status: payload.permissionStatus || "unknown",
      user_agent: payload.userAgent || null,
      device_type: payload.deviceType || "web",
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "onesignal_id",
    },
  );

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Nao foi possivel salvar inscricao push." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
