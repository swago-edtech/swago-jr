// apps/web/src/app/lottery-code/page.tsx

import { getLoginSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import LotteryClient from "./LotteryClient";

export default async function LotteryPage() {
    const session = await getLoginSession();

    // Restriction: Only logged in users can access the lottery page
    if (!session) {
        redirect("/login?callbackUrl=/lottery-code");
    }

    return <LotteryClient />;
}
