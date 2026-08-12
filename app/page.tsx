import { redirect } from "next/navigation"

// PRD상 별도 마케팅 홈페이지가 정의되어 있지 않으므로,
// 루트 접근 시 사용자 여정의 첫 진입점인 로그인 페이지로 리다이렉트한다.
export default function Home() {
  redirect("/login")
}
