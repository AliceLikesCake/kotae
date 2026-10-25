import PageSkeleton from "./components/PageSkeleton";

// 首頁（以及沒有自己 loading.tsx 的頁面）載入中的畫面
export default function Loading() {
  return <PageSkeleton lines={[3, 3, 2]} nav />;
}
