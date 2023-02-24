// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
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
      body: req.body,
    }
  );

  console.log(response.status, await response.json()); // DEBUG

  // Request was valid, return the auth code to the redirect_uri
  if (response.status === 200) {
    const code = await response.json();
    res.redirect(
      302,
      `${req.body.redirect_uri}?code=${code}&state=${req.body.state}`
    );
  }

  // Request was invalid, re-prompt the user to authenticate
  res.redirect(500, "/");
}
