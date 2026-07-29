import { type NextRequest, NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/orbit/feature-flags";
import { setGuestIdentity } from "@/lib/portal/guest-identity";
import { verifyGuestOtp, verifyOtpSchema } from "@/lib/portal/verification";

/**
 * Public — exchanges a valid one-time code for a signed guest-identity cookie.
 * No user record and no Better Auth session are created: the cookie carries
 * only the verified address and a display name.
 */
export async function POST(req: NextRequest) {
  if (!(await isFeatureEnabled("guest_voting"))) {
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: issue?.message ?? "Enter the code we emailed you.",
        field: issue?.path[0] === "email" ? "email" : "code",
      },
      { status: 400 }
    );
  }

  try {
    const result = await verifyGuestOtp(
      parsed.data.email,
      parsed.data.code,
      parsed.data.name
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, field: "code" },
        { status: 400 }
      );
    }

    await setGuestIdentity(result.data);

    return NextResponse.json({
      email: result.data.email,
      name: result.data.name,
    });
  } catch (err) {
    console.error("[POST /api/portal/otp/verify]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
