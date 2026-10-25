import PageSkeleton from "../components/PageSkeleton";

// 設定載入中的畫面
export default function Loading() {
  return <PageSkeleton lines={[2, 3, 3]} />;
}
