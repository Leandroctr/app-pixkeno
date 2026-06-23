import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const bucketName = "app-assets";

const allowedExtensions = new Set(["png", "jpg", "jpeg", "webp", "svg", "ico"]);
const allowedTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const maxBytesByKind: Record<string, number> = {
  logo: 500 * 1024,
  favicon: 100 * 1024,
  icon192: 300 * 1024,
  icon512: 500 * 1024,
  splash: 1024 * 1024,
  splashHtml: 500 * 1024,
};

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  console.log("[UPLOAD] Iniciando upload...");

  if (!(await isAdminAuthenticated())) {
    console.log("[UPLOAD] Erro: não autenticado");
    return NextResponse.json(
      { ok: false, error: "Nao autenticado." },
      { status: 401 },
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    console.log("[UPLOAD] Erro: Supabase não configurado");
    console.log("[UPLOAD] SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("[UPLOAD] SERVICE_ROLE_KEY existe:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    return NextResponse.json(
      { ok: false, error: "Supabase nao configurado." },
      { status: 503 },
    );
  }

  console.log("[UPLOAD] Supabase client criado com sucesso");

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = String(formData.get("kind") || "asset");

  console.log("[UPLOAD] Kind:", kind);
  console.log("[UPLOAD] File:", file instanceof File ? `${file.name} (${file.size} bytes, ${file.type})` : "não é File");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Arquivo nao enviado." },
      { status: 400 },
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const maxBytes = maxBytesByKind[kind] || 500 * 1024;
  const isHtmlSplash = kind === "splashHtml";

  console.log("[UPLOAD] Extension:", extension);
  console.log("[UPLOAD] Max bytes:", maxBytes);
  console.log("[UPLOAD] Is HTML splash:", isHtmlSplash);

  if (isHtmlSplash) {
    if (extension !== "html") {
      console.log("[UPLOAD] Erro: formato HTML inválido", extension);
      return NextResponse.json(
        { ok: false, error: "Formato invalido. Envie um arquivo .html." },
        { status: 400 },
      );
    }
  } else {
    if (!allowedExtensions.has(extension) || (file.type && !allowedTypes.has(file.type))) {
      console.log("[UPLOAD] Erro: formato inválido", extension, file.type);
      return NextResponse.json(
        { ok: false, error: "Formato invalido. Envie PNG, JPG, WEBP, SVG ou ICO." },
        { status: 400 },
      );
    }
  }

  if (file.size > maxBytes) {
    console.log("[UPLOAD] Erro: arquivo muito grande", file.size, ">", maxBytes);
    return NextResponse.json(
      {
        ok: false,
        error: `Arquivo acima do limite de ${Math.round(maxBytes / 1024)} KB.`,
      },
      { status: 400 },
    );
  }

  const safeName = sanitizeFileName(file.name) || `asset.${extension}`;
  const path = `${kind}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const uploadContentType = isHtmlSplash ? "text/html" : file.type;

  console.log("[UPLOAD] Path:", path);
  console.log("[UPLOAD] Content-Type:", uploadContentType);
  console.log("[UPLOAD] Enviando para Supabase Storage...");

  const { error } = await supabase.storage.from(bucketName).upload(path, file, {
    cacheControl: "31536000",
    contentType: uploadContentType,
    upsert: false,
  });

  if (error) {
    console.log("[UPLOAD] Erro no Supabase Storage:", JSON.stringify(error));
    return NextResponse.json(
      { ok: false, error: "Nao foi possivel enviar o arquivo." },
      { status: 500 },
    );
  }

  console.log("[UPLOAD] Upload concluído com sucesso!");

  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);

  return NextResponse.json({
    ok: true,
    url: data.publicUrl,
    path,
  });
}