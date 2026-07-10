import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getUser = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return user;
});

export const getCompanyId = cache(async (): Promise<string> => {
  const user = await getUser();

  // Check metadata first
  const metadataCompanyId =
    user.user_metadata?.company_id as string | undefined;

  if (metadataCompanyId) {
    return metadataCompanyId;
  }

  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  const userRow = data as { company_id: string } | null;

  if (error) {
    throw new Error(
      `Unable to load company for user ${user.id}: ${error.message}`
    );
  }

  if (!userRow || !userRow.company_id) {
    throw new Error(
      `User ${user.id} does not have a company_id assigned`
    );
  }

  return userRow.company_id;
});