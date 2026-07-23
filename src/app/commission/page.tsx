import { redirect } from "next/navigation";

/** Commissioning happens in the Loom. There is no separate form to fill twice. */
export default function CommissionPage() {
  redirect("/loom");
}
