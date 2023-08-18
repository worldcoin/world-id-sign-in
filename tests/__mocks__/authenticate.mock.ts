export const AUTHENTICATE_MOCK: {
  [key: string]: string;
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  nonce: string;
  merkle_root: string;
  proof: string;
  credential_type: string;
  nullifier_hash: string;
} = {
  response_type: "token",
  response_mode: "fragment", // NOTE: This is not required in /authorize, but after validation for /authenticate endpoint it is required
  client_id: "app_staging_cb4113a6f4f9dcd1f6cd6e05377dd614",
  redirect_uri: "https://test.worldcoin.org/hello",
  scope: "openid",
  nonce: "e2e-tests-1",
  merkle_root:
    "0x07686fdef6cad625b2dca159865b2180c6fef8d665b41dcd9b3da4dc9c9f43d1",
  proof:
    "0x1e9b8f02741073035c1598743303cf7f46a34c8d6f341c54388476a00db9e8a401f6bc98ebd1f4613c2042b2533d54ac5af82da16047cc93dd1e2d0c8e8254902491bfb64ecbb5961588bad7e1e5cf67dcaab104a81a0c537598083aa9cc1d3e1d6bf132f62a767a1e1a8b5d31e29e661f2ac0f0174b9a242fb8cbed3df73f1d2928c65642eda4a97c9fe9031565d633fdea3011dde4fa8737e93f7385ee8ab407d782f2c7eaf9afe42794a42f98eae9c2b576c90ade96bf956042e7f69bd65a03dcf0048d8f1be849465bce7a7d06d1ea0bee643b6de67bfafc3f3e64a2e25d14ad534c04b8737f9093466cd5c7a51231790ce9bf80449c3568e55a508979a8",
  credential_type: "orb",
  nullifier_hash:
    "0x2978b7ab28667fc641e0a38af57b6d177592d268a6d97aec19205a97bf456f23",
};
