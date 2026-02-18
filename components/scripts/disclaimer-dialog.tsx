"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Shield } from "lucide-react";

const DISCLAIMER_STORAGE_KEY = "script-lab-disclaimer-dismissed";

export function DisclaimerDialog() {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the disclaimer
    const dismissed = localStorage.getItem(DISCLAIMER_STORAGE_KEY);
    if (!dismissed) {
      // Small delay to ensure page is loaded
      setTimeout(() => setOpen(true), 300);
    }
  }, []);

  const handleAccept = () => {
    if (dontShowAgain) {
      localStorage.setItem(DISCLAIMER_STORAGE_KEY, "true");
    }
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing by clicking outside or pressing ESC - user must click "I Understand"
    if (!newOpen && open) {
      return;
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <DialogTitle>Important Security Disclaimer</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Please read this warning carefully before using real funds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">
                This tool allows you to create and broadcast Bitcoin transactions on the BSV network.
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-muted-foreground ml-2">
                <li>
                  <strong className="text-foreground">Test thoroughly</strong> with small amounts before using significant funds
                </li>
                <li>
                  <strong className="text-foreground">Verify all details</strong> before broadcasting transactions
                </li>
                <li>
                  <strong className="text-foreground">Double-check addresses</strong> — transactions are irreversible
                </li>
                <li>
                  <strong className="text-foreground">Keep private keys secure</strong> — never share them or enter them on untrusted sites
                </li>
                <li>
                  <strong className="text-foreground">Script validation</strong> in the playground may not catch all real-world issues
                </li>
                <li>
                  <strong className="text-foreground">Network fees</strong> are deducted from your balance — ensure sufficient funds
                </li>
              </ul>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">You are solely responsible</strong> for any funds sent using this tool. 
              Transactions broadcast to the BSV network cannot be reversed.
            </p>
            <p>
              This tool is provided "as is" without warranty. Use at your own risk.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label
              htmlFor="dont-show-again"
              className="text-sm font-normal cursor-pointer text-muted-foreground"
            >
              Don&apos;t show this again
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleAccept} className="min-w-[100px]">
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
