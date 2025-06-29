}{ pkgs, ... }: {
  # To learn more about how to use Nix to configure your environment
  # see: https://developers.google.com/idx/guides/customize-dev-env
  channel = "stable-24.05"; # or "unstable"

  packages = [
    pkgs.git
 pkgs.nodejs_20
    # These packages are for running integration tests that utilize a sandbox
    # environment with containerization (Docker/Podman).
    pkgs.docker
    pkgs.podman
  ];

  env = {
    # GEMINI_API_KEY: Your API key for the Gemini API. Required for most interactions.
    # DISCORD_BOT_TOKEN: Your Discord bot token. Required for running the Discord bot.
    # DISCORD_GUILD_ID: The ID of the Discord guild (server) where you want to register slash commands. Optional.
    # DEBUG_MODE: Set to 'true' to enable debug logging.
    # HTTPS_PROXY: Set if you need to use an HTTP proxy.
  };

  idx = {
    extensions = [
      "vscodevim.vim"
      "esbenp.prettier-vscode"
    ];

    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "npm" "run" "start" ];
          manager = "web";
          env = {
            PORT = "$PORT";
          };
        };
      };
    };

    workspace = {
      onCreate = {
        npm-install = "npm ci";
      };
      onStart = {
        # Consider setting up VS Code tasks for common development commands like build, test, lint, etc.
      };
    };
  };
}
