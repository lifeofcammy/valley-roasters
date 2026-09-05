import { Logo } from "@/components/shared/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo size="large" />
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Account Pending</CardTitle>
            <CardDescription>
              Your wholesale account is awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Our team is reviewing your application. You&apos;ll receive an email
              once your account has been approved and activated.
            </p>
            <p className="text-sm text-muted-foreground">
              Questions? Contact us at{" "}
              <a href="mailto:info@valleyspecialtyroasters.com" className="text-primary hover:underline">
                info@valleyspecialtyroasters.com
              </a>
            </p>
            <form action="/api/auth/signout" method="POST">
              <Button variant="outline" className="mt-4">
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
