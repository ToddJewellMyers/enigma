# Optional AI terminal extension

AI assistance is intentionally disabled in the current Sweet Mahogany Boards terminal. The application does not read an API key, call an AI provider, or transmit terminal output.

The disabled **Explain error (AI)** control reserves the user-interface location for a future opt-in implementation. Before enabling it, the implementation should satisfy all of these requirements:

1. Store the API credential only in a local ignored environment file or operating-system credential store. Never expose it to the hosted Kanban renderer or commit it to Git.
2. Make the user select or preview the exact terminal text that will be sent.
3. Remove obvious secrets such as tokens, authorization headers, connection strings, and private keys before transmission.
4. Display the provider, model, and data being sent before the first request.
5. Return explanations separately from proposed commands.
6. Never execute a generated command automatically. Show the exact command and require explicit approval at action time.
7. Keep AI access inside the trusted local terminal window and a main-process IPC handler. The hosted Sweet Mahogany Boards page must not receive the API key or AI response.
8. Provide a clear off switch and document retention and privacy behavior.

A future implementation can add a narrow `terminal:explain-selection` IPC method without changing the isolated-window architecture introduced for the Community edition.
