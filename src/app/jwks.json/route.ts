import { DEVELOPER_PORTAL } from "@/consts";

export const GET = async (): Promise<Response> => {
	return fetch(`${DEVELOPER_PORTAL}/api/v1/jwks`);
};
