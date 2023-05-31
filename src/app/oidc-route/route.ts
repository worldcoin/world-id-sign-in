import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEVELOPER_PORTAL } from "@/consts";

const handler = async (req: NextRequest): Promise<NextResponse> => {
	if (!req.url || req.url === "/oidc-route") {
		return new NextResponse("Not found", { status: 404 });
	}

	const destUrl = new URL(
		`${DEVELOPER_PORTAL}/api/v1/oidc${req.nextUrl.pathname}`
	);

	destUrl.search = req.nextUrl.searchParams.toString();

	let headers = new Headers({
		"Content-Type": req.headers.get("content-type") || "application/json",
	});

	if (req.headers.has("authorization")) {
		headers.append("Authorization", req.headers.get("authorization")!);
	}

	const body =
		req.headers.get("content-type") === "application/x-www-form-urlencoded"
			? new URLSearchParams(await req.json())
			: JSON.stringify(req.body);

	const response = await fetch(destUrl, {
		headers,
		method: req.method,
		body: req.method === "POST" ? body : undefined,
	});

	if (response.status === 404) {
		return new NextResponse("Not found", { status: 404 });
	}

	if (response.status >= 500) {
		console.error(
			`Received 500+ response from Developer Portal`,
			req.url,
			response.status
		);
		console.error(await response.text());

		return NextResponse.json(
			{
				code: "server_error",
				message: "Internal server error. Please try again.",
			},
			{ status: 500 }
		);
	}

	const corsOrigin = response.headers.get("allow-control-allow-origin");
	const corsMethods = response.headers.get("allow-control-allow-methods");
	const corsHeaders = response.headers.get("allow-control-allow-headers");

	headers = new Headers();
	if (corsOrigin) headers.append("Access-Control-Allow-Origin", corsOrigin);
	if (corsMethods) headers.append("Access-Control-Allow-Methods", corsMethods);
	if (corsHeaders) headers.append("Access-Control-Allow-Headers", corsHeaders);

	return NextResponse.json(await response.json(), {
		headers,
		status: response.status,
	});
};

export const GET = handler;
export const POST = handler;
