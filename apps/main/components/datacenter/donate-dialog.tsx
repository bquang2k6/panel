"use client";

import { useEffect, useState } from "react";

import { donationActions } from "@/features/datacenter/actions";
import type { Donation, DonationPayload } from "@/features/datacenter/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donation: Donation | null;
  onSuccess: () => Promise<void> | void;
}

const defaultForm: DonationPayload = {
  donorname: "",
  amount: "",
  date: "",
  message: "",
};

export function DonateDialog({
  open,
  onOpenChange,
  donation,
  onSuccess,
}: DonateDialogProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<DonationPayload>(defaultForm);

  useEffect(() => {
    if (!open) return;

    if (donation) {
      setFormData({
        donorname: donation.donorname,
        amount: String(donation.amount),
        date: donation.date.slice(0, 16),
        message: donation.message,
      });
    } else {
      setFormData(defaultForm);
    }
  }, [open, donation]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? value.replace(/\D/g, "") : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);

      if (donation) {
        await donationActions.update(donation.id, formData);
      } else {
        await donationActions.create(formData);
      }

      await onSuccess();

      onOpenChange(false);

      setFormData(defaultForm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: string) => {
    if (!value) return "";

    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    })
      .format(Number(value))
      .replace("₫", "đ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {donation ? "Edit Donation Record" : "Add Donation Record"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Donor Name</Label>
            <Input
              required
              name="donorname"
              placeholder="Enter donor name..."
              value={formData.donorname}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Amount (VND)</Label>
            <Input
              required
              name="amount"
              placeholder="Enter donation amount..."
              value={formatCurrency(formData.amount)}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Donation Date</Label>
            <Input
              required
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Message</Label>
            <Input
              name="message"
              placeholder="Enter optional donor message..."
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button disabled={loading} type="submit" className="bg-primary">
              {loading ? "Saving..." : donation ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}