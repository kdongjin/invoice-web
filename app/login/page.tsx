import type { Metadata } from "next"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginForm } from "@/components/patterns/login-form"
import { PageContainer } from "@/components/layout/page-container"
import { Section } from "@/components/layout/section"

export const metadata: Metadata = {
  title: "로그인 | 노션 견적서 뷰어",
  description: "노션 견적서 뷰어 관리자 계정으로 로그인하세요.",
}

export default function LoginPage() {
  return (
    <Section className="flex flex-1 items-center py-12 sm:py-16">
      <PageContainer className="flex justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">로그인</CardTitle>
            <CardDescription>
              계정에 로그인하고 서비스를 이용해보세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </PageContainer>
    </Section>
  )
}
