import { useEffect, useState } from "react";
import { initialAdminData, loadAdminData } from "../services/adminDataService";

export default function useAdminData(){
  const [data, setData] = useState(initialAdminData);
  const [loading, setLoading] = useState(true);

  async function reload(){
    setLoading(true);
    const nextData = await loadAdminData();
    setData(nextData);
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  return { data, loading, reload };
}
