import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { drawQuestions } from "@/lib/cb/client";
import { CATEGORY_TO_DOMAIN } from "@/lib/cb/domains";
import type { Difficulty } from "@/lib/cb/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIFF_MAP: Record<string, Difficulty | null> = {
  all: null,
  easy: "E",
  medium: "M",
  hard: "H",
  E: "E",
  M: "M",
  H: "H",
};

const QuerySchema = z.object({
  section: z.enum(["rw", "math"]),
  // design category id (info/craft/.../alg/...) OR raw CB domain code
  category: z.string().optional(),
  domain: z.string().optional(),
  difficulty: z.string().optional().default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.issues[0]?.message ?? "Invalid query" },
      { status: 400 },
    );
  }
  const { section, category, domain, difficulty, limit } = parsed.data;

  const domainCode = domain || (category ? CATEGORY_TO_DOMAIN[category] : undefined);
  const diff = DIFF_MAP[difficulty] ?? null;

  try {
    const questions = await drawQuestions({
      section,
      domains: domainCode ? [domainCode] : undefined,
      difficulty: diff,
      limit,
    });
    return NextResponse.json({
      success: true,
      data: { questions, count: questions.length },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load questions";
    return NextResponse.json({ success: false, data: null, error: message }, { status: 502 });
  }
}
