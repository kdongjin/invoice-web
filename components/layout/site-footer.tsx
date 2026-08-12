import { Separator } from "@/components/ui/separator"
import { PageContainer } from "@/components/layout/page-container"

export function SiteFooter() {
  return (
    <footer className="w-full">
      <Separator />
      <PageContainer className="py-8">
        <p className="text-sm text-muted-foreground">
          © 2026 노션 견적서 뷰어. All rights reserved.
        </p>
      </PageContainer>
    </footer>
  )
}
