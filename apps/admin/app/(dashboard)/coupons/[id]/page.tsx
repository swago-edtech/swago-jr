"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import CouponForm from "@/components/CouponForm";

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [coupon, setCoupon] = useState<any>(null);

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        setFetching(true);
        const res = await fetch(`/api/coupons/${id}`);
        const data = await res.json();
        if (data.success && data.coupon) {
          const c = data.coupon;
          setCoupon({
            code: c.code,
            type: c.type,
            value: c.value,
            description: c.description,
            minAmount: c.minAmount,
            maxDiscount: c.maxDiscount,
            active: c.active,
            expiryDate: c.expiryDate
              ? new Date(c.expiryDate).toISOString().split("T")[0]
              : "",
            usageLimit: c.usageLimit,
            applicableProducts: c.applicableProducts || [],
            isPublic: c.isPublic ?? true,
            isExpressOnly: c.isExpressOnly ?? false,
            targetGroup: c.targetGroup || "all",
          });
        } else {
          alert(data.error || "Failed to fetch coupon");
          router.push("/coupons");
        }
      } catch (error) {
        console.error("Error fetching coupon:", error);
        alert("Something went wrong while fetching coupon data");
        router.push("/coupons");
      } finally {
        setFetching(false);
      }
    };

    fetchCoupon();
  }, [id, router]);

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading coupon details...</p>
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-600 font-medium">Coupon not found</p>
      </div>
    );
  }

  return <CouponForm mode="edit" initialData={coupon} couponId={id} />;
}
