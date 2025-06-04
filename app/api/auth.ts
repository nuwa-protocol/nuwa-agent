import { NextRequest } from "next/server";
import { getServerSideConfig } from "../config/server";
import md5 from "spark-md5";
import { ACCESS_CODE_PREFIX, ModelProvider } from "../constant";
import { validateDid } from "../utils/did";

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();
  const isApiKey = !token.startsWith(ACCESS_CODE_PREFIX);

  return {
    accessCode: isApiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: isApiKey ? token : "",
  };
}

function validateDidHeaders(req: NextRequest): boolean {
  const didHeader = req.headers.get("x-did");
  const signatureHeader = req.headers.get("x-did-signature");
  const timestampHeader = req.headers.get("x-did-timestamp");

  if (!didHeader || !signatureHeader || !timestampHeader) {
    return false;
  }

  try {
    const timestamp = parseInt(timestampHeader);
    const didInfo = {
      did: didHeader,
      signature: signatureHeader,
      timestamp: timestamp,
    };

    return validateDid(didInfo);
  } catch (error) {
    console.error("[DID Auth] Validation error:", error);
    return false;
  }
}

export function auth(req: NextRequest, modelProvider: ModelProvider) {
  // Check for DID authentication first
  const hasDid = req.headers.get("x-did");
  if (hasDid) {
    console.log("[DID Auth] Attempting DID authentication");
    const isValidDid = validateDidHeaders(req);
    console.log("[DID Auth] DID validation result:", isValidDid);
    console.log("[User IP] ", getIP(req));
    console.log("[Time] ", new Date().toLocaleString());

    if (isValidDid) {
      return { error: false };
    } else {
      return {
        error: true,
        msg: "Invalid DID authentication",
      };
    }
  }

  // Fallback to traditional authentication
  const authToken = req.headers.get("Authorization") ?? "";

  // check if it is openai api key or user token
  const { accessCode, apiKey } = parseApiKey(authToken);

  const hashedCode = md5.hash(accessCode ?? "").trim();

  const serverConfig = getServerSideConfig();
  console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  console.log("[Auth] got access code:", accessCode);
  console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());

  if (serverConfig.needCode && !serverConfig.codes.has(hashedCode) && !apiKey) {
    return {
      error: true,
      msg: !accessCode ? "empty access code" : "wrong access code",
    };
  }

  if (serverConfig.hideUserApiKey && !!apiKey) {
    return {
      error: true,
      msg: "you are not allowed to access with your own api key",
    };
  }

  // if user does not provide an api key, inject system api key
  if (!apiKey) {
    const serverConfig = getServerSideConfig();

    // const systemApiKey =
    //   modelProvider === ModelProvider.GeminiPro
    //     ? serverConfig.googleApiKey
    //     : serverConfig.isAzure
    //     ? serverConfig.azureApiKey
    //     : serverConfig.apiKey;

    let systemApiKey: string | undefined;

    switch (modelProvider) {
      case ModelProvider.GeminiPro:
        systemApiKey = serverConfig.googleApiKey;
        break;
      case ModelProvider.Claude:
        systemApiKey = serverConfig.anthropicApiKey;
        break;
      case ModelProvider.GPT:
      default:
        if (serverConfig.isAzure) {
          systemApiKey = serverConfig.azureApiKey;
        } else {
          systemApiKey = serverConfig.apiKey;
        }
    }

    if (systemApiKey) {
      console.log("[Auth] use system api key");
      req.headers.set("Authorization", `Bearer ${systemApiKey}`);
    } else {
      console.log("[Auth] admin did not provide an api key");
    }
  } else {
    console.log("[Auth] use user api key");
  }

  return {
    error: false,
  };
}
