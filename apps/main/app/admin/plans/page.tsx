import { Check, Plus } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { formatCurrency } from "@/lib/format";

import { getPlans } from "@/lib/queries";

import { CreatePlanButton, PlanActions } from "@/components/admin/plan-actions";

export default async function PlansPage() {
  const plans = await getPlans();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Plans"
        description="Manage subscription plans and pricing."
      >
        <CreatePlanButton />
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={plan.name === "Premium" ? "border-primary shadow-md" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold">
                  {plan.price === 0
                    ? "Free"
                    : formatCurrency(plan.price, plan.currency)}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground">
                    /{plan.interval === "month" ? "month" : "year"}
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">
                {plan.subscriber_count.toLocaleString()} subscribers
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <PlanActions plan={plan} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
