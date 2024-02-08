import { GET } from "@/app/.well-known/openid-configuration/route";
import { NextRequest } from "next/server";

describe("/.well-known/openid-configuration", () => {
  test("can fetch params", async () => {
    const req = new NextRequest(
      "http://localhost/.well-known/openid-configuration",
      {
        method: "GET",
      }
    );
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toEqual(
      expect.objectContaining({
        issuer: "https://id.worldcoin.org",
        token_endpoint: "https://id.worldcoin.org/token",
        jwks_uri: "https://id.worldcoin.org/jwks.json",
        code_challenge_methods_supported: ["S256"],
        subject_types_supported: ["pairwise"],
        response_modes_supported: ["query", "fragment", "form_post"],
      })
    );
  });
});
