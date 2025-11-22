export type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

const endpoint = "/api/graphql";

export async function requestGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "GraphQL request failed");
  }

  if (!payload.data) {
    throw new Error("No data returned");
  }

  return payload.data;
}
