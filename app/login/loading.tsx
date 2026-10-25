import PageSkeleton from "../components/PageSkeleton";

// 登入頁不顯示底部導覽，所以不沿用首頁的載入畫面
export default function Loading() {
  return <PageSkeleton lines={[2]} />;
}
