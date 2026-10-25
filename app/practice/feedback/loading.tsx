import PageSkeleton from "../../components/PageSkeleton";

// AI 回饋載入中的畫面
export default function Loading() {
  return <PageSkeleton lines={[2, 3, 3]} />;
}
