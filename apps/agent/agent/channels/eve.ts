import { localDev, vercelOidc } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

const developmentAuth = localDev();

// Eve checks the server's development mode; Bundjil also requires a loopback URL.
export const localhostDevelopmentAuth = (request: Request) => {
  const { hostname } = new URL(request.url);
  if (
    hostname !== "localhost" &&
    hostname !== "127.0.0.1" &&
    hostname !== "[::1]"
  ) {
    return null;
  }
  return developmentAuth(request);
};

export default eveChannel({ auth: [vercelOidc(), localhostDevelopmentAuth] });
