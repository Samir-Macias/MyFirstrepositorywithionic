import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

interface GithubWebhookPayload {
  action?: string;
  pull_request?: {
    number: number;
    state: string;
    title: string;
    merged?: boolean;
  };
  issue?: {
    number: number;
    state: string;
    title: string;
  };
  repository?: {
    name: string;
  };
}

function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);
  const data = encoder.encode(payload);

  return crypto.subtle
    .sign("HMAC", key, data)
    .then((signatureBuffer) => {
      const hex = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const expected = `sha256=${hex}`;
      return expected === signature;
    });
}

async function updateTaskStatus(
  supabase: ReturnType<typeof createClient>,
  prNumber: number,
  status: string
) {
  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("github_pr_number", prNumber)
    .single();

  if (fetchError) {
    console.error("Error fetching task:", fetchError);
    return;
  }

  if (!task) {
    console.log(`No task found for PR #${prNumber}`);
    return;
  }

  const { error: updateError } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", task.id);

  if (updateError) {
    console.error("Error updating task:", updateError);
  } else {
    console.log(`Updated task ${task.id} to status: ${status}`);
  }
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const webhookSecret = Deno.env.get("GITHUB_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response("Missing webhook secret configuration", { status: 500 });
  }

  const payload = await req.text();

  const isValid = await verifyGitHubSignature(payload, signature, webhookSecret);
  if (!isValid) {
    console.error("Invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  const body: GithubWebhookPayload = JSON.parse(payload);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    if (body.pull_request) {
      const { action, pull_request } = body;
      let taskStatus = "in_progress";

      if (action === "opened") {
        taskStatus = "in_progress";
      } else if (action === "closed" && pull_request.merged) {
        taskStatus = "completed";
      } else if (action === "closed" && !pull_request.merged) {
        taskStatus = "failed";
      }

      await updateTaskStatus(supabase, pull_request.number, taskStatus);

      return new Response(
        JSON.stringify({
          success: true,
          message: `PR #${pull_request.number} processed`,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (body.issue) {
      const { action, issue } = body;
      let taskStatus = "pending";

      if (action === "opened") {
        taskStatus = "pending";
      } else if (action === "closed") {
        taskStatus = "completed";
      }

      console.log(
        `Issue #${issue.number} (${action}): ${issue.title} -> ${taskStatus}`
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: `Issue #${issue.number} processed`,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook received" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};
