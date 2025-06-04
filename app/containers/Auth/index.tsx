import { IconButton } from "@/app/components/button";
import { useNavigate } from "react-router-dom";
import { Path } from "@/app/constant";
import { useAccessStore } from "@/app/store";
import Locale from "@/app/locales";
import BotIcon from "@/app/icons/bot.svg";
import { useEffect, useState } from "react";
import { getClientConfig } from "@/app/config/client";
import { parseDid } from "@/app/utils/did";

export function AuthPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();
  const [didError, setDidError] = useState("");

  const goHome = () => navigate(Path.Home);
  const goChat = () => navigate(Path.Chat);
  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
      access.didCredential = "";
    });
  };

  const handleDidInput = (value: string) => {
    accessStore.update((access) => {
      access.didCredential = value;
    });

    // Validate DID format
    if (value) {
      const validation = parseDid(value);
      if (!validation.isValid) {
        setDidError(Locale.Auth.Did.InvalidFormat);
      } else {
        setDidError("");
      }
    } else {
      setDidError("");
    }
  };

  const switchAuthMethod = (method: "traditional" | "did") => {
    accessStore.update((access) => {
      access.authMethod = method;
    });
  };

  useEffect(() => {
    if (getClientConfig()?.isApp) {
      navigate(Path.Settings);
    }
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-full w-full flex-col bg-white">
      {/* Logo */}
      <div className="no-dark transform scale-140 mb-8">
        <BotIcon />
      </div>

      {/* Title */}
      <div className="text-2xl font-bold leading-8 mb-6 text-center">
        {Locale.Auth.Title}
      </div>

      {/* Auth Method Selector */}
      <div className="my-4 text-center">
        <div className="text-sm font-medium mb-2 text-black">
          {Locale.Auth.Did.AuthMethod}
        </div>
        <div className="flex justify-center gap-2.5">
          <button
            className={`
              px-4 py-2 border rounded-lg cursor-pointer text-sm transition-all duration-200 ease-in-out
              ${
                accessStore.authMethod === "traditional"
                  ? "bg-blue-500 text-white border-blue-500"
                  : "border-gray-300 bg-white text-black hover:bg-gray-100"
              }
            `}
            onClick={() => switchAuthMethod("traditional")}
          >
            {Locale.Auth.Did.Traditional}
          </button>
          <button
            className={`
              px-4 py-2 border rounded-lg cursor-pointer text-sm transition-all duration-200 ease-in-out
              ${
                accessStore.authMethod === "did"
                  ? "bg-blue-500 text-white border-blue-500"
                  : "border-gray-300 bg-white text-black hover:bg-gray-100"
              }
            `}
            onClick={() => switchAuthMethod("did")}
          >
            {Locale.Auth.Did.DidAuth}
          </button>
        </div>
      </div>

      {/* Traditional Authentication Form */}
      {accessStore.authMethod === "traditional" ? (
        <div className="flex flex-col items-center w-full">
          <div className="text-sm mb-4 text-center">{Locale.Auth.Tips}</div>
          <input
            className="
              appearance-none rounded-xl border border-gray-300 min-h-9 bg-white 
              text-black px-2.5 max-w-xs w-full mb-6 font-inherit
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            "
            type="password"
            placeholder={Locale.Auth.Input}
            value={accessStore.accessCode}
            onChange={(e) => {
              accessStore.update(
                (access) => (access.accessCode = e.currentTarget.value),
              );
            }}
          />
          {!accessStore.hideUserApiKey && (
            <>
              <div className="text-sm mb-4 text-center">
                {Locale.Auth.SubTips}
              </div>
              <input
                className="
                  appearance-none rounded-xl border border-gray-300 min-h-9 bg-white 
                  text-black px-2.5 max-w-xs w-full mb-6 font-inherit
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                "
                type="password"
                placeholder={Locale.Settings.Access.OpenAI.ApiKey.Placeholder}
                value={accessStore.openaiApiKey}
                onChange={(e) => {
                  accessStore.update(
                    (access) => (access.openaiApiKey = e.currentTarget.value),
                  );
                }}
              />
              <input
                className="
                  appearance-none rounded-xl border border-gray-300 min-h-9 bg-white 
                  text-black px-2.5 max-w-xs w-full mb-6 font-inherit
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                "
                type="password"
                placeholder={Locale.Settings.Access.Google.ApiKey.Placeholder}
                value={accessStore.googleApiKey}
                onChange={(e) => {
                  accessStore.update(
                    (access) => (access.googleApiKey = e.currentTarget.value),
                  );
                }}
              />
            </>
          )}
        </div>
      ) : (
        /* DID Authentication Form */
        <div className="flex flex-col items-center w-full">
          <div className="text-sm mb-4 text-center">{Locale.Auth.Did.Tips}</div>
          <input
            className="
              appearance-none rounded-xl border border-gray-300 min-h-9 bg-white 
              text-black px-2.5 max-w-xs w-full mb-2 font-inherit
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            "
            type="text"
            placeholder={Locale.Auth.Did.Input}
            value={accessStore.didCredential}
            onChange={(e) => handleDidInput(e.currentTarget.value)}
          />
          {didError && (
            <div className="text-red-500 text-xs text-center mb-4">
              {didError}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center flex-col mt-6">
        <div className="mb-2.5">
          <IconButton
            text={Locale.Auth.Confirm}
            type="primary"
            onClick={goChat}
          />
        </div>
        <div>
          <IconButton
            text={Locale.Auth.Later}
            onClick={() => {
              resetAccessCode();
              goHome();
            }}
          />
        </div>
      </div>
    </div>
  );
}
