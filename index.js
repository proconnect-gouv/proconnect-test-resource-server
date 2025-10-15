import express from "express";
import dotenv from "dotenv";
import * as client from "openid-client";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const getProviderConfig = async () => {
  const config = await client.discovery(
    new URL(process.env.PC_DISCOVERY_URL),
    process.env.PC_CLIENT_ID,
    {
      introspection_signed_response_alg:
        process.env.PC_INTROSPECTION_SIGNED_RESPONSE_ALG,
    },
    client.ClientSecretPost(process.env.PC_CLIENT_SECRET),
    { execute: [client.allowInsecureRequests] }
  );
  return config;
};

app.get("/api/data", async (req, res) => {
  const access_token = req.headers.authorization?.split(" ")[1];
  if (!access_token) {
    console.error("No access token provided");
    return res.status(401).send({ error: "No access token provided" });
  }
  const config = await getProviderConfig();

  try {
    const result = await client.tokenIntrospection(config, access_token);
    if (!result.active) {
      console.error("Token is not active");
      return res.status(401).send({ error: "Your token is not active" });
    }
    return {
      active: result.active,
      sub: result.sub,
      scope: result.scope,
      data: `This is some data related to user ${result.sub}`,
    };
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
