import type { Metadata } from "next"
import BrandClient from "./BrandClient"

export const metadata: Metadata = {
  title: "Brand",
  description: "HUGHLOU brand assets — logotype, icon, and usage guidelines.",
}

export default function BrandPage() {
  return <BrandClient />
}
