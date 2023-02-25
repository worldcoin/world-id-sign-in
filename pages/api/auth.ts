import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  code: string;
};

export default async function handleAuth(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log("handleAuth()"); // DEBUG

  // Request an authorization code from the server
  console.log(req.body); // DEBUG}

  const response = await fetch(
    "https://dev2.worldcoin.org/api/v1/oidc/authorize",
    {
      method: "POST",
      headers: new Headers({ "content-type": "application/json" }),
      body: JSON.stringify(req.body),
    }
  );

  console.log(response.status); // DEBUG
  console.log(await response.json()); // DEBUG

  // Request was valid, return the auth code to the redirect_uri
  if (response.ok) {
    const code = await response.json();
    console.log(code); // DEBUG

    res.redirect(
      302,
      `${req.body.redirect_uri}?code=${code.code}&state=${req.body.state}`
    );
  }

  // Request was invalid, re-prompt the user to authenticate
  res.status(500).json({ code: "error" });
}
