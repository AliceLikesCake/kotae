import { getT } from "../i18n/server";
import { leaveDemo } from "../login/actions";
import styles from "./DemoBanner.module.css";

// 示範模式時顯示在每一頁最上面：提醒是範例資料，可以隨時離開
export default async function DemoBanner() {
  const t = await getT();
  return (
    <div className={styles.banner} role="status">
      <span>{t.demo.banner}</span>
      <form action={leaveDemo}>
        <button type="submit" className={styles.leave}>
          {t.demo.leave}
        </button>
      </form>
    </div>
  );
}
