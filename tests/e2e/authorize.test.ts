import { NextRequest } from "next/server";
import { GET as handlerAuthorizeRoute } from "@/app/authorize/route";

const AUTHORIZE_MOCK = {
  response_type: "id_token token",
  client_id: "client_id",
  redirect_uri: "redirect_uri",
  scope: "openid profile",
  state: "state",
  nonce: "nonce",
};

describe("Authorize test", () => {
  test("Throws error when nonce not exists for implicit flow", async () => {
    const params = new URLSearchParams({
      ...AUTHORIZE_MOCK,
      nonce: "",
    } as any);

    const req = new NextRequest(
      `http://localhost/authorize?${params.toString()}`
    );

    const res = await handlerAuthorizeRoute(req);
    expect(res.status).toBe(302);
  });
});
