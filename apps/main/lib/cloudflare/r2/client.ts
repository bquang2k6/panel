const CLOUDFLARE_GRAPHQL_URL =
  "https://api.cloudflare.com/client/v4/graphql";

export async function cloudflareGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  credentials?: { accountId?: string; apiToken?: string },
): Promise<T> {
  const accountId = credentials?.accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = credentials?.apiToken || process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID hoặc CLOUDFLARE_API_TOKEN chưa được cấu hình.",
    );
  }

  const response = await fetch(CLOUDFLARE_GRAPHQL_URL, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      query,
      variables: {
        accountTag: accountId,
        ...variables,
      },
    }),

    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok || result.errors) {
    throw new Error(
      result.errors
        ?.map(
          (error: { message: string }) =>
            error.message,
        )
        .join(", ") ||
        "Cloudflare GraphQL request failed",
    );
  }

  return result.data;
}