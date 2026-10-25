import PageSkeleton from "../components/PageSkeleton";

// 練習紀錄載入中的畫面
export default function Loading() {
  return <PageSkeleton lines={[2, 2, 2]} nav />;
}
