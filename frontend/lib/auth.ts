import { createAuthClient } from "better-auth/client";
import { phoneNumberClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_NEON_AUTH_URL || "https://ep-lively-lab-aq14rajy.neonauth.c-8.us-east-1.aws.neon.tech/neondb/auth",
  plugins: [phoneNumberClient()],
  fetchOptions: {
    onSuccess: async (ctx) => {
      const jwt = ctx.response.headers.get("set-auth-jwt");
      if (jwt) {
        localStorage.setItem("tab_token", jwt);
      }
    }
  }
});
